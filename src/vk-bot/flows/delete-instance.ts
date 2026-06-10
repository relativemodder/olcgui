import type { Flow } from './index';
import type { Database } from 'bun:sqlite';
import { Keyboard } from 'vk-io';
import { setSession } from '../session';
import { authKeyboard } from '../keyboard';
import { createAuthedApiClient } from '../config';

export function parseDeleteConfirmation(payload: Record<string, unknown> | null | undefined): boolean | null {
	if (!payload || typeof payload.confirm !== 'boolean') return null;
	return payload.confirm;
}

function deleteConfirmKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'Да, удалить',
				payload: { confirm: true },
				color: Keyboard.NEGATIVE_COLOR
			}),
			Keyboard.textButton({
				label: 'Отмена',
				payload: { confirm: false },
				color: Keyboard.SECONDARY_COLOR
			})
		]
	]).inline();
}

export function createDeleteFlow(db: Database): Flow {
	return {
		name: 'delete-instance',

		start: async (context) => {
			const id = context.messagePayload?.id as number | undefined;
			if (!id) {
				await context.send('Ошибка: не указан ID инстанса.', {
					keyboard: authKeyboard()
				});
				return;
			}

			const client = createAuthedApiClient(db, context.senderId);
			if (!client) {
				await context.send('Ошибка авторизации.', {
					keyboard: authKeyboard()
				});
				return;
			}

			try {
				const instance = await client.instances.get(id);
				setSession(context.senderId, 'delete-instance', {
					step: 'confirm',
					instanceId: id
				});

				await context.send(
					`Вы уверены, что хотите удалить инстанс "${instance.name}"?\n\nЭто действие нельзя отменить.`,
					{
						keyboard: deleteConfirmKeyboard()
					}
				);
			} catch {
				await context.send('Не удалось получить информацию об инстансе.', {
					keyboard: authKeyboard()
				});
			}
		},

		steps: {
			confirm: async (context, data) => {
				if (context.messagePayload?.command === '/cancel') {
					await context.send('Удаление отменено.', {
						keyboard: authKeyboard()
					});
					return;
				}

				const confirmed = parseDeleteConfirmation(context.messagePayload);
				const instanceId = data.instanceId as number;

				if (confirmed === null) {
					await context.send('Подтвердите удаление кнопками или отмените действие.', {
						keyboard: deleteConfirmKeyboard()
					});
					return 'confirm';
				}

				if (confirmed) {
					const client = createAuthedApiClient(db, context.senderId);
					if (!client) {
						await context.send('Ошибка авторизации.', {
							keyboard: authKeyboard()
						});
						return;
					}

					try {
						await client.instances.remove(instanceId);
						await context.send('Инстанс удалён.', {
							keyboard: authKeyboard()
						});
					} catch (e: unknown) {
						const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
						await context.send(`Ошибка удаления: ${msg}`, {
							keyboard: authKeyboard()
						});
					}
				} else {
					await context.send('Удаление отменено.', {
						keyboard: authKeyboard()
					});
				}
			}
		}
	};
}
