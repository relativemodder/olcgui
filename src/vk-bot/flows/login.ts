import type { Flow } from './index';
import { createLinkRequest } from '../db';
import { setSession } from '../session';
import { loginFlowKeyboard, unauthKeyboard } from '../keyboard';

function generateCode(): string {
	return String(Math.floor(100000 + Math.random() * 900000));
}

export const loginFlow: Flow = {
	name: 'login',

	start: async (context) => {
		setSession(context.senderId, 'login', { step: 'awaiting_username' });
		await context.send('Введите ваш username в панели управления:', {
			keyboard: loginFlowKeyboard()
		});
	},

	steps: {
		awaiting_username: async (context, data) => {
			const username = (context.text || '').trim();
			if (!username) {
				await context.send('Имя пользователя не может быть пустым.', {
					keyboard: loginFlowKeyboard()
				});
				return 'awaiting_username';
			}

			const code = generateCode();
			data.username = username;
			data.code = code;

			createLinkRequest(context.senderId, username, code);

			await context.send(
				[
					`Код подтверждения: ${code}`,
					'',
					'Перейдите в панель управления → Настройки → Доступ',
					'и введите этот код. Он действителен 5 минут.'
				].join('\n'),
				{ keyboard: unauthKeyboard() }
			);
		}
	}
};
