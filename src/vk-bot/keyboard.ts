import { Keyboard } from 'vk-io';

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

export function loginFlowKeyboard() {
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
