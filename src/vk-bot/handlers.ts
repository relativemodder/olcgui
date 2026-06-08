import type { MessageContext } from 'vk-io';
import type { ApiClient } from '../shared/api';
import type { Database } from 'bun:sqlite';
import { createAuthedApiClient, createApiClient, API_BACKEND_URL } from './config';
import { deleteToken } from './db';
import { getFlow, routeFlow } from './flows/index';
import {
	clearSession,
	deduplicate,
	markResponded,
	hasResponded,
	checkUserCooldown
} from './session';
import { authKeyboard, unauthKeyboard } from './keyboard';

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

	const hasToken = (vkId: number) =>
		db
			.query<{ api_token: string }, number>('SELECT api_token FROM users WHERE vk_id = ?')
			.get(vkId) !== null;

	return [
		{
			pattern: /^(?:\/start|start|начать)$/i,
			handler: async (context) => {
				const authed = hasToken(context.senderId);
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
				const authed = hasToken(context.senderId);
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
				const authed = hasToken(context.senderId);
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
				if (hasToken(context.senderId)) {
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
							`${i + 1}. ${inst.name} - ${inst.status === 'running' ? 'работает' : 'остановлен'}`
					);
					await context.send(['Инстансы:', ...lines].join('\n'), { keyboard: authKeyboard() });
				} catch {
					await context.send('Не удалось получить список инстансов', { keyboard: authKeyboard() });
				}
			},
			description: 'Список инстансов',
			needsAuth: true
		}
	];
}

export async function handleMessage(context: MessageContext, commands: Command[]): Promise<void> {
	if (!context.text) return;

	if (context.isOutbox) return;

	if (deduplicate(context.id)) return;

	if (hasResponded(context.id)) return;

	if (checkUserCooldown(context.senderId, 1200)) return;

	const command = context.messagePayload?.command || context.text;

	if (await routeFlow(context)) {
		markResponded(context.id);
		return;
	}

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
