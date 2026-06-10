import type { MessageContext } from 'vk-io';
import type { ApiClient } from '../shared/api';
import type { Database } from 'bun:sqlite';
import type { InstanceDto } from '../shared/api/types';
import { generateOlcrtcUri, parseRoomUrl } from '../shared/wizard/utils';
import { formatInstanceInfo, formatInstanceList, formatSystemStats } from './presentation';
import { vk } from './vk';
import { createAuthedApiClient, createApiClient, API_BACKEND_URL } from './config';
import { deleteToken } from './db';
import { getFlow, routeFlow } from './flows/index';
import {
	clearSession,
	deduplicate,
	markResponded,
	hasResponded,
	checkUserCooldown,
	getSession
} from './session';
import {
	authKeyboard,
	unauthKeyboard,
	instanceListKeyboard,
	instanceActionKeyboard
} from './keyboard';

type Handler = (context: MessageContext, api: ApiClient) => void | Promise<void>;
type InstanceAction = (context: MessageContext, client: ApiClient, id: number) => Promise<void>;

interface Command {
	pattern: RegExp | string;
	handler: Handler;
	description: string;
	needsAuth: boolean;
}

function match(text: string, pattern: RegExp | string): RegExpMatchArray | null {
	if (typeof pattern === 'string') {
		return text === pattern ? ([''] as unknown as RegExpMatchArray) : null;
	}
	return text.match(pattern);
}

function getPayloadInstanceId(context: MessageContext): number | null {
	const id = context.messagePayload?.id;
	return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null;
}

export function createHandlers(db: Database): Command[] {
	const authed = (vkId: number) => {
		const client = createAuthedApiClient(db, vkId);
		if (!client) return null;
		return client;
	};

	const hasTokenLocal = (vkId: number) =>
		db
			.query<{ api_token: string }, number>('SELECT api_token FROM users WHERE vk_id = ?')
			.get(vkId) !== null;

	const ensureAuthedLocal = async (context: MessageContext): Promise<boolean> => {
		if (hasTokenLocal(context.senderId)) return true;
		await context.send('Сначала привяжите аккаунт.', { keyboard: unauthKeyboard() });
		return false;
	};

	const withAuthed =
		(handler: (context: MessageContext, client: ApiClient) => Promise<void>): Handler =>
		async (context) => {
			if (!(await ensureAuthedLocal(context))) return;
			const client = authed(context.senderId);
			if (!client) return;
			await handler(context, client);
		};

	const withInstanceAction = (action: InstanceAction): Handler =>
		withAuthed(async (context, client) => {
			const id = getPayloadInstanceId(context);
			if (!id) {
				await context.send('Ошибка: не указан ID инстанса.', { keyboard: authKeyboard() });
				return;
			}

			await action(context, client, id);
		});

	const withInstanceMutation = (
		action: (client: ApiClient, id: number) => Promise<void>,
		successMessage: string,
		errorPrefix: string
	): Handler =>
		withInstanceAction(async (context, client, id) => {
			try {
				await action(client, id);
				await context.send(successMessage, { keyboard: authKeyboard() });
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
				await context.send(`${errorPrefix}: ${msg}`, { keyboard: authKeyboard() });
			}
		});

	return [
		{
			pattern: /^(?:\/start|start|начать)$/i,
			handler: async (context) => {
				const authed = hasTokenLocal(context.senderId);
				if (authed) {
					await context.send(
						'Привет! Я бот управления панелью. Используйте кнопки для управления.',
						{ keyboard: authKeyboard() }
					);
				} else {
					await context.send(
						'Привет! Я бот управления панелью. Нажмите кнопку, чтобы привязать аккаунт.',
						{ keyboard: unauthKeyboard() }
					);
				}
			},
			description: 'Показать приветствие',
			needsAuth: false
		},
		{
			pattern: '/cancel',
			handler: async (context) => {
				clearSession(context.senderId);
				const authed = hasTokenLocal(context.senderId);
				await context.send('Отменено.', {
					keyboard: authed ? authKeyboard() : unauthKeyboard()
				});
			},
			description: 'Отменить текущее действие',
			needsAuth: false
		},
		{
			pattern: '/help',
			handler: async (context) => {
				const authed = hasTokenLocal(context.senderId);
				if (authed) {
					await context.send('Кнопки управления панелью.', { keyboard: authKeyboard() });
				} else {
					await context.send('Привяжите аккаунт, чтобы начать.', { keyboard: unauthKeyboard() });
				}
			},
			description: 'Показать справку',
			needsAuth: false
		},
		{
			pattern: '/login',
			handler: async (context) => {
				if (hasTokenLocal(context.senderId)) {
					await context.send('Вы уже привязаны.', { keyboard: authKeyboard() });
					return;
				}
				const flow = getFlow('login');
				if (!flow) return;
				await flow.start(context);
			},
			description: 'Привязать аккаунт панели',
			needsAuth: false
		},
		{
			pattern: '/logout',
			handler: async (context) => {
				deleteToken(context.senderId);
				clearSession(context.senderId);
				await context.send('Аккаунт отвязан.', { keyboard: unauthKeyboard() });
			},
			description: 'Отвязать аккаунт',
			needsAuth: false
		},
		{
			pattern: '/status',
			handler: withAuthed(async (context, client) => {
				try {
					const stats = await client.system.stats();
					await context.send(formatSystemStats(stats), { keyboard: authKeyboard() });
				} catch {
					await context.send('Не удалось получить статус системы', { keyboard: authKeyboard() });
				}
			}),
			description: 'Статус системы',
			needsAuth: true
		},
		{
			pattern: '/instances',
			handler: withAuthed(async (context, client) => {
				try {
					const instances = await client.instances.list();
					if (instances.length === 0) {
						await context.send('Нет активных инстансов', { keyboard: authKeyboard() });
						return;
					}
					await context.send(formatInstanceList(instances), {
						keyboard: instanceListKeyboard(instances)
					});
				} catch {
					await context.send('Не удалось получить список инстансов', { keyboard: authKeyboard() });
				}
			}),
			description: 'Список инстансов',
			needsAuth: true
		},
		{
			pattern: '/instance_create',
			handler: async (context) => {
				const flow = getFlow('create-instance');
				if (!flow) return;
				await flow.start(context);
			},
			description: 'Создать новый инстанс',
			needsAuth: true
		},
		{
			pattern: '/instance_view',
			handler: withInstanceAction(async (context, client, id) => {
				try {
					const instance = await client.instances.get(id);
					await context.send(formatInstanceInfo(instance), {
						keyboard: instanceActionKeyboard(instance.id, instance.status)
					});
					await sendConfigFile(context, instance);
				} catch {
					await context.send('Не удалось получить информацию об инстансе.', {
						keyboard: authKeyboard()
					});
				}
			}),
			description: 'Просмотр инстанса',
			needsAuth: true
		},
		{
			pattern: '/instance_start',
			handler: withInstanceMutation(
				(client, id) => client.instances.start(id),
				'Инстанс запущен.',
				'Ошибка запуска'
			),
			description: 'Запустить инстанс',
			needsAuth: true
		},
		{
			pattern: '/instance_stop',
			handler: withInstanceMutation(
				(client, id) => client.instances.stop(id),
				'Инстанс остановлен.',
				'Ошибка остановки'
			),
			description: 'Остановить инстанс',
			needsAuth: true
		},
		{
			pattern: '/instance_restart',
			handler: withInstanceMutation(
				(client, id) => client.instances.restart(id),
				'Инстанс перезапускается...',
				'Ошибка перезапуска'
			),
			description: 'Перезапустить инстанс',
			needsAuth: true
		},
		{
			pattern: '/instance_delete',
			handler: async (context) => {
				const flow = getFlow('delete-instance');
				if (!flow) return;
				await flow.start(context);
			},
			description: 'Удалить инстанс',
			needsAuth: true
		}
	];
}
async function sendConfigFile(context: MessageContext, inst: InstanceDto): Promise<void> {
	const importUri = generateOlcrtcUri(
		inst.provider,
		inst.transport,
		inst.roomUrl,
		inst.cryptoKey,
		inst.name
	);

	const olcboxConfig = {
		auth_provider: inst.provider,
		room_id: parseRoomUrl(inst.roomUrl, inst.provider),
		key: inst.cryptoKey,
		transport: inst.transport,
		name: inst.name
	};

	try {
		const doc = await vk.upload.messageDocument({
			peer_id: context.peerId,
			source: {
				value: Buffer.from(JSON.stringify(olcboxConfig, null, 2), 'utf-8'),
				filename: `${inst.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
			},
			title: `olcbox-${inst.name}.json`
		});
		await context.send({
			message: `Конфиг для olcbox:\n${importUri}`,
			attachment: doc,
			keyboard: instanceActionKeyboard(inst.id, inst.status)
		});
	} catch (e) {
		console.error('[VK] failed to upload config file:', e);
	}
}

export async function handleMessage(context: MessageContext, commands: Command[]): Promise<void> {
	if (context.isOutbox) return;

	const text = context.text?.trim() ?? '';
	const payloadCommand =
		typeof context.messagePayload?.command === 'string' ? context.messagePayload.command : '';
	const command = payloadCommand || text;
	const hasInteractiveInput = command.length > 0 || context.messagePayload !== null;
	if (!hasInteractiveInput) return;

	if (deduplicate(context.id)) return;

	if (hasResponded(context.id)) return;

	if (await routeFlow(context)) {
		markResponded(context.id);
		return;
	}

	if (!command) return;

	if (!getSession(context.senderId) && checkUserCooldown(context.senderId, 1200)) return;

	for (const cmd of commands) {
		const matched = match(command, cmd.pattern);
		if (matched) {
			(context as Record<string, unknown>).$match = matched;
			const unauthed = createApiClient(API_BACKEND_URL);
			await cmd.handler(context, unauthed);
			markResponded(context.id);
			return;
		}
	}
}
