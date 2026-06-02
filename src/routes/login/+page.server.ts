import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, destroySession } from '$lib/server/auth/session';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, { error: 'Введите логин и пароль' });
		}

		try {
			const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

			if (!user) {
				return fail(400, { error: 'Неверный логин или пароль' });
			}

			const isPasswordCorrect = await verifyPassword(password, user.passwordHash);
			if (!isPasswordCorrect) {
				return fail(400, { error: 'Неверный логин или пароль' });
			}

			const sessionToken = createSession(user.id, user.username, user.role);
			cookies.set('session', sessionToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: false,
				maxAge: 60 * 60 * 24
			});
		} catch (error) {
			console.error('[LoginAction] Login error:', error);
			return fail(500, { error: 'Ошибка входа. Попробуйте ещё раз.' });
		}

		throw redirect(303, '/');
	},

	logout: async ({ cookies }) => {
		const sessionToken = cookies.get('session');
		destroySession(sessionToken);
		cookies.delete('session', { path: '/' });
		throw redirect(303, '/login');
	}
};
