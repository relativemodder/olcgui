import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const allUsers = await db
			.select({
				id: users.id,
				username: users.username,
				role: users.role,
				createdAt: users.createdAt
			})
			.from(users);

		return {
			adminUsers: allUsers,
			currentUser: locals.user
		};
	} catch (error) {
		console.error('[UsersLoad] Failed to load users:', error);
		return {
			adminUsers: [],
			currentUser: locals.user
		};
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();
		const confirm = data.get('confirmPassword')?.toString();

		if (!username || !password || !confirm) {
			return fail(400, { error: 'Пожалуйста, заполните все поля формы.' });
		}

		if (password !== confirm) {
			return fail(400, { error: 'Пароли не совпадают.' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Пароль должен быть длиной не менее 6 символов.' });
		}

		try {
			const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);

			if (existing) {
				return fail(400, { error: 'Пользователь с таким именем уже зарегистрирован.' });
			}

			const passwordHash = await hashPassword(password);
			await db.insert(users).values({
				username,
				passwordHash,
				role: 'admin'
			});

			return { success: true };
		} catch (error) {
			console.error('[UsersCreate] Database error:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Не удалось создать администратора.'
			});
		}
	},

	delete: async ({ url, locals }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) {
			return fail(400, { error: 'Идентификатор пользователя не указан.' });
		}

		if (locals.user && locals.user.userId === id) {
			return fail(400, { error: 'Вы не можете удалить свою собственную учетную запись.' });
		}

		try {
			await db.delete(users).where(eq(users.id, id));
			return { success: true };
		} catch (error) {
			console.error('[UsersDelete] Error deleting user:', error);
			return fail(500, {
				error: error instanceof Error ? error.message : 'Не удалось удалить пользователя.'
			});
		}
	}
};
