import type { Flow } from './index';
import type { Database } from 'bun:sqlite';
import { Keyboard } from 'vk-io';
import { setSession } from '../session';
import { flowKeyboard, authKeyboard } from '../keyboard';
import { createAuthedApiClient } from '../config';
import type { Mode, Provider, Transport } from '../../shared/wizard/constants';
import { PROVIDER_CONFIG } from '../../shared/wizard/constants';

const PROVIDERS = ['jitsi', 'wbstream', 'telemost'] as const;
const TRANSPORTS = ['datachannel', 'vp8channel', 'seichannel', 'videochannel'] as const;

function generateKey(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function providerKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'Jitsi',
				payload: { provider: 'jitsi' },
				color: Keyboard.PRIMARY_COLOR
			}),
			Keyboard.textButton({
				label: 'WB Stream',
				payload: { provider: 'wbstream' },
				color: Keyboard.PRIMARY_COLOR
			})
		],
		[
			Keyboard.textButton({
				label: 'Telemost',
				payload: { provider: 'telemost' },
				color: Keyboard.PRIMARY_COLOR
			})
		]
	]).inline();
}

function transportKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'DataChannel',
				payload: { transport: 'datachannel' },
				color: Keyboard.PRIMARY_COLOR
			}),
			Keyboard.textButton({
				label: 'VP8 Channel',
				payload: { transport: 'vp8channel' },
				color: Keyboard.PRIMARY_COLOR
			})
		],
		[
			Keyboard.textButton({
				label: 'SEI Channel',
				payload: { transport: 'seichannel' },
				color: Keyboard.PRIMARY_COLOR
			}),
			Keyboard.textButton({
				label: 'Video Channel',
				payload: { transport: 'videochannel' },
				color: Keyboard.PRIMARY_COLOR
			})
		]
	]).inline();
}

function confirmKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'Да, создать',
				payload: { confirm: true },
				color: Keyboard.POSITIVE_COLOR
			}),
			Keyboard.textButton({
				label: 'Отмена',
				payload: { confirm: false },
				color: Keyboard.NEGATIVE_COLOR
			})
		]
	]).inline();
}

function isCancel(context: { messagePayload?: Record<string, unknown> | null }): boolean {
	return context.messagePayload?.command === '/cancel';
}

function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

export function isSupportedRoomUrl(provider: Provider, roomUrl: string): boolean {
	if (!isValidUrl(roomUrl)) return false;

	const hostname = new URL(roomUrl).hostname;
	if (provider === 'wbstream') return hostname === 'stream.wb.ru';
	if (provider === 'telemost') return hostname === 'telemost.yandex.ru';
	return true;
}

function isAllowedTransport(provider: Provider, transport: Transport): boolean {
	return (PROVIDER_CONFIG[provider].allowedTransports as readonly string[]).includes(transport);
}

export function createCreateFlow(db: Database): Flow {
	return {
		name: 'create-instance',

		start: async (context) => {
			setSession(context.senderId, 'create-instance', { step: 'name' });
			await context.send('Введите название для нового инстанса:', {
				keyboard: flowKeyboard()
			});
		},

		steps: {
			name: async (context, data) => {
				if (isCancel(context)) {
					await context.send('Создание отменено.', { keyboard: authKeyboard() });
					return;
				}

				const name = (context.text || '').trim();
				if (!name) {
					await context.send('Название не может быть пустым. Введите название:', {
						keyboard: flowKeyboard()
					});
					return 'name';
				}

				data.name = name;
				data.mode = 'srv';
				await context.send('Выберите провайдера:', { keyboard: providerKeyboard() });
				return 'provider';
			},

			provider: async (context, data) => {
				if (isCancel(context)) {
					await context.send('Создание отменено.', { keyboard: authKeyboard() });
					return;
				}

				const payload = context.messagePayload;
				let provider = payload?.provider as string | null;

				if (!provider && context.text) {
					const t = context.text.toLowerCase().trim();
					if (/^(jitsi|1)$/i.test(t)) provider = 'jitsi';
					else if (/^(wbstream|wb|2)$/i.test(t)) provider = 'wbstream';
					else if (/^(telemost|3)$/i.test(t)) provider = 'telemost';
				}

				if (provider && (PROVIDERS as readonly string[]).includes(provider)) {
					data.provider = provider;
					await context.send('Введите URL комнаты:', { keyboard: flowKeyboard() });
					return 'roomUrl';
				}

				await context.send('Пожалуйста, выберите провайдера кнопками:', {
					keyboard: providerKeyboard()
				});
				return 'provider';
			},

			roomUrl: async (context, data) => {
				if (isCancel(context)) {
					await context.send('Создание отменено.', { keyboard: authKeyboard() });
					return;
				}

				const url = (context.text || '').trim();
				if (!url) {
					await context.send('URL комнаты не может быть пустым. Введите URL:', {
						keyboard: flowKeyboard()
					});
					return 'roomUrl';
				}

				if (!data.provider || !isSupportedRoomUrl(data.provider as Provider, url)) {
					await context.send('Введите корректный URL комнаты для выбранного провайдера.', {
						keyboard: flowKeyboard()
					});
					return 'roomUrl';
				}

				data.roomUrl = url;
				await context.send('Выберите транспорт:', { keyboard: transportKeyboard() });
				return 'transport';
			},

			transport: async (context, data) => {
				if (isCancel(context)) {
					await context.send('Создание отменено.', { keyboard: authKeyboard() });
					return;
				}

				const payload = context.messagePayload;
				let transport = payload?.transport as string | null;

				if (!transport && context.text) {
					const t = context.text.toLowerCase().trim();
					if (/^(datachannel|dc|1)$/i.test(t)) transport = 'datachannel';
					else if (/^(vp8channel|vp8|2)$/i.test(t)) transport = 'vp8channel';
					else if (/^(seichannel|sei|3)$/i.test(t)) transport = 'seichannel';
					else if (/^(videochannel|video|vc|4)$/i.test(t)) transport = 'videochannel';
				}

				if (transport && (TRANSPORTS as readonly string[]).includes(transport)) {
					if (
						!data.provider ||
						!isAllowedTransport(data.provider as Provider, transport as Transport)
					) {
						await context.send('Этот транспорт не поддерживается выбранным провайдером.', {
							keyboard: transportKeyboard()
						});
						return 'transport';
					}

					data.transport = transport;
					data.cryptoKey = generateKey();

					const summary = [
						'Проверьте параметры:',
						`Название: ${data.name}`,
						`Режим: ${data.mode === 'srv' ? 'Сервер' : 'Клиент'}`,
						`Провайдер: ${data.provider}`,
						`Комната: ${data.roomUrl}`,
						`Транспорт: ${data.transport}`,
						`Ключ: ${data.cryptoKey}`,
						'',
						'Всё верно?'
					].join('\n');

					await context.send(summary, { keyboard: confirmKeyboard() });
					return 'confirm';
				}

				await context.send('Пожалуйста, выберите транспорт кнопками:', {
					keyboard: transportKeyboard()
				});
				return 'transport';
			},

			confirm: async (context, data) => {
				if (isCancel(context)) {
					await context.send('Создание отменено.', { keyboard: authKeyboard() });
					return;
				}

				const payload = context.messagePayload;
				const confirmed = payload?.confirm;

				if (confirmed) {
					const client = createAuthedApiClient(db, context.senderId);
					if (!client) {
						await context.send('Ошибка авторизации. Попробуйте перепривязать аккаунт.', {
							keyboard: authKeyboard()
						});
						return;
					}

					try {
						const instance = await client.instances.create({
							name: data.name as string,
							mode: data.mode as Mode,
							provider: data.provider as Provider,
							roomUrl: data.roomUrl as string,
							cryptoKey: data.cryptoKey as string,
							transport: data.transport as Transport
						});
						await context.send(`Инстанс "${instance.name}" успешно создан!`, {
							keyboard: authKeyboard()
						});
					} catch (e: unknown) {
						const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
						await context.send(`Ошибка создания: ${msg}`, {
							keyboard: authKeyboard()
						});
					}
				} else {
					await context.send('Создание инстанса отменено.', {
						keyboard: authKeyboard()
					});
				}
			}
		}
	};
}
