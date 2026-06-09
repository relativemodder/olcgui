import { Keyboard } from 'vk-io';
import type { InstanceDto } from '../shared/api/types';

export function unauthKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'Войти в панель',
				payload: { command: '/login' },
				color: Keyboard.POSITIVE_COLOR
			})
		]
	]);
}

export function authKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'Статус',
				payload: { command: '/status' },
				color: Keyboard.PRIMARY_COLOR
			}),
			Keyboard.textButton({
				label: 'Инстансы',
				payload: { command: '/instances' },
				color: Keyboard.PRIMARY_COLOR
			})
		],
		[
			Keyboard.textButton({
				label: 'Создать',
				payload: { command: '/instance_create' },
				color: Keyboard.POSITIVE_COLOR
			}),
			Keyboard.textButton({
				label: 'Помощь',
				payload: { command: '/help' },
				color: Keyboard.SECONDARY_COLOR
			}),
			Keyboard.textButton({
				label: 'Выйти',
				payload: { command: '/logout' },
				color: Keyboard.NEGATIVE_COLOR
			})
		]
	]);
}

export function instanceListKeyboard(instances: InstanceDto[]) {
	return Keyboard.keyboard(
		instances.map((inst) => [
			Keyboard.textButton({
				label: `${inst.name} — ${inst.status === 'running' ? 'работает' : 'остановлен'}`,
				payload: { command: '/instance_view', id: inst.id },
				color: inst.status === 'running' ? Keyboard.POSITIVE_COLOR : Keyboard.SECONDARY_COLOR
			})
		])
	).inline();
}

export function instanceActionKeyboard(instanceId: number, status: string) {
	const row: ReturnType<typeof Keyboard.textButton>[] = [];

	if (status === 'stopped' || status === 'error') {
		row.push(
			Keyboard.textButton({
				label: 'Запустить',
				payload: { command: '/instance_start', id: instanceId },
				color: Keyboard.POSITIVE_COLOR
			})
		);
	}
	if (status === 'running') {
		row.push(
			Keyboard.textButton({
				label: 'Остановить',
				payload: { command: '/instance_stop', id: instanceId },
				color: Keyboard.NEGATIVE_COLOR
			}),
			Keyboard.textButton({
				label: 'Перезапустить',
				payload: { command: '/instance_restart', id: instanceId },
				color: Keyboard.PRIMARY_COLOR
			})
		);
	}

	return Keyboard.keyboard([
		row,
		[
			Keyboard.textButton({
				label: 'Удалить',
				payload: { command: '/instance_delete', id: instanceId },
				color: Keyboard.NEGATIVE_COLOR
			}),
			Keyboard.textButton({
				label: 'Назад',
				payload: { command: '/instances' },
				color: Keyboard.SECONDARY_COLOR
			})
		]
	]).inline();
}

export function flowKeyboard() {
	return Keyboard.keyboard([
		[
			Keyboard.textButton({
				label: 'Отмена',
				payload: { command: '/cancel' },
				color: Keyboard.NEGATIVE_COLOR
			})
		]
	]);
}
