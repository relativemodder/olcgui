import type { MessageContext } from 'vk-io';
import type { ApiClient } from '../shared/api';
import type { Database } from 'bun:sqlite';
import type { InstanceDto } from '../shared/api/types';
import { generateOlcrtcUri, parseRoomUrl } from '../shared/wizard/utils';
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
			handler: async (context) => {
				const client = authed(context.senderId);
				if (!client) {
					await context.send('Сначала привяжите аккаунт.', { keyboard: unauthKeyboard() });
					return;
				}
				try {
					const stats = await client.system.stats();
					const msg = [
						'Статус системы:',
						`CPU: ${stats.cpuPercent.toFixed(1)}%`,
						`RAM: ${(stats.memoryUsed / 1024 / 1024).toFixed(1)}/${(stats.memoryTotal / 1024 / 1024).toFixed(1)} MB`,
						`Сеть: ${(stats.networkRxSec / 1024).toFixed(1)} KB/s входящий / ${(stats.networkTxSec / 1024).toFixed(1)} KB/s исходящий`
					].join('\n');
					await context.send(msg, { keyboard: authKeyboard() });
				} catch {
					await context.send('Не удалось получить статус системы', { keyboard: authKeyboard() });
				}
			},
			description: 'Статус системы',
			needsAuth: true
		},
		{
			pattern: '/instances',
			handler: async (context) => {
				const client = authed(context.senderId);
				if (!client) {
					await context.send('Сначала привяжите аккаунт.', { keyboard: unauthKeyboard() });
					return;
				}
				try {
					const instances = await client.instances.list();
					if (instances.length === 0) {
						await context.send('Нет активных инстансов', { keyboard: authKeyboard() });
						return;
					}
					const lines = instances.map(
						(inst, i) =>
							`${i + 1}. ${inst.name} — ${inst.status === 'running' ? 'работает' : 'остановлен'}`
					);
					await context.send(['Инстансы:', ...lines].join('\n'), {
						keyboard: instanceListKeyboard(instances)
					});
				} catch {
					await context.send('Не удалось получить список инстансов', { keyboard: authKeyboard() });
				}
			},
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
			handler: async (context) => {
				if (!(await ensureAuthedLocal(context))) return;
				const client = authed(context.senderId);
				if (!client) return;

				const id = context.messagePayload?.id as number | undefined;
				if (!id) {
					await context.send('Ошибка: не указан ID инстанса.', { keyboard: authKeyboard() });
					return;
				}

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
			},
			description: 'Просмотр инстанса',
			needsAuth: true
		},
		{
			pattern: '/instance_start',
			handler: async (context) => {
				if (!(await ensureAuthedLocal(context))) return;
				const client = authed(context.senderId);
				if (!client) return;

				const id = context.messagePayload?.id as number | undefined;
				if (!id) return;

				try {
					await client.instances.start(id);
					await context.send('Инстанс запущен.', { keyboard: authKeyboard() });
				} catch (e: unknown) {
					const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
					await context.send(`Ошибка запуска: ${msg}`, { keyboard: authKeyboard() });
				}
			},
			description: 'Запустить инстанс',
			needsAuth: true
		},
		{
			pattern: '/instance_stop',
			handler: async (context) => {
				if (!(await ensureAuthedLocal(context))) return;
				const client = authed(context.senderId);
				if (!client) return;

				const id = context.messagePayload?.id as number | undefined;
				if (!id) return;

				try {
					await client.instances.stop(id);
					await context.send('Инстанс остановлен.', { keyboard: authKeyboard() });
				} catch (e: unknown) {
					const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
					await context.send(`Ошибка остановки: ${msg}`, { keyboard: authKeyboard() });
				}
			},
			description: 'Остановить инстанс',
			needsAuth: true
		},
		{
			pattern: '/instance_restart',
			handler: async (context) => {
				if (!(await ensureAuthedLocal(context))) return;
				const client = authed(context.senderId);
				if (!client) return;

				const id = context.messagePayload?.id as number | undefined;
				if (!id) return;

				try {
					await client.instances.restart(id);
					await context.send('Инстанс перезапускается...', { keyboard: authKeyboard() });
				} catch (e: unknown) {
					const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
					await context.send(`Ошибка перезапуска: ${msg}`, { keyboard: authKeyboard() });
				}
			},
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

function formatInstanceInfo(inst: InstanceDto): string {
	const statusLabels: Record<string, string> = {
		running: 'работает',
		stopped: 'остановлен',
		restarting: 'перезапускается',
		error: 'ошибка'
	};
	const modeLabels: Record<string, string> = {
		srv: 'Сервер',
		cnc: 'Клиент'
	};

	return [
		`${inst.name}`,
		`━━━━━━━━━━━━━━━`,
		`Статус: ${statusLabels[inst.status] || inst.status}`,
		`Режим: ${modeLabels[inst.mode] || inst.mode}`,
		`Провайдер: ${inst.provider}`,
		`Транспорт: ${inst.transport}`,
		`Комната: ${inst.roomUrl}`,
		...(inst.socksPort ? [`SOCKS5: порт ${inst.socksPort}`] : []),
		...(inst.autoRestart ? [`Авторестарт: вкл`] : [`Авторестарт: выкл`]),
		...(inst.restartInterval ? [`Интервал: ${inst.restartInterval} мин`] : [])
	].join('\n');
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
