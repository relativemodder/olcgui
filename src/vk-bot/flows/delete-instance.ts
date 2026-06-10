import type { Flow } from './index';
import type { Database } from 'bun:sqlite';
import { Keyboard } from 'vk-io';
import { setSession } from '../session';
import { authKeyboard } from '../keyboard';
import {
	ensureAuthedClient,
	isCancelCommand,
	parseBooleanChoice,
	sendFlowCancelled
} from './shared';

export function parseDeleteConfirmation(
	payload: Record<string, unknown> | null | undefined
): boolean | null {
	return parseBooleanChoice(payload, 'confirm');
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

			const client = await ensureAuthedClient(db, context);
			if (!client) {
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
				if (isCancelCommand(context)) return sendFlowCancelled(context, 'Удаление отменено.');

				const confirmed = parseDeleteConfirmation(context.messagePayload);
				const instanceId = data.instanceId as number;

				if (confirmed === null) {
					await context.send('Подтвердите удаление кнопками или отмените действие.', {
						keyboard: deleteConfirmKeyboard()
					});
					return 'confirm';
				}

				if (confirmed) {
					const client = await ensureAuthedClient(db, context);
					if (!client) {
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
