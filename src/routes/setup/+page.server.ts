import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { hashPassword } from '$lib/server/auth/password';
import { createSession, setSessionCookie } from '$lib/server/auth/session';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!username || !password || !confirmPassword) {
			return fail(400, { error: 'Все поля обязательны для заполнения' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Имя пользователя должно содержать не менее 3 символов' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Пароль должен содержать не менее 6 символов' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Введенные пароли не совпадают' });
		}

		try {
			const existingUsers = await db.select().from(users).limit(1);
			if (existingUsers.length > 0) {
				return fail(400, { error: 'Администратор уже создан.' });
			}

			const passwordHash = await hashPassword(password);

			const [newAdmin] = await db
				.insert(users)
				.values({
					username,
					passwordHash,
					role: 'admin'
				})
				.returning();

			const sessionToken = createSession(newAdmin.id, newAdmin.username, newAdmin.role);
			setSessionCookie(cookies, sessionToken);
		} catch (error) {
			console.error('[SetupAction] Onboarding failed:', error);
			return fail(500, { error: 'Ошибка БД. Не удалось создать аккаунт.' });
		}

		throw redirect(303, '/');
	}
};
