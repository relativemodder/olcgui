import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { updateSessionUsername } from '$lib/server/auth/session';
import { fail } from '@sveltejs/kit';
import { requireAuth, requireAdmin, normalizeError } from '$lib/server/auth/guards';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const allUsers = locals.user?.role === 'admin'
			? await db
					.select({
						id: users.id,
						username: users.username,
						role: users.role,
						createdAt: users.createdAt
					})
					.from(users)
			: [];

		return {
			allUsers,
			currentUser: locals.user
		};
	} catch (error) {
		console.error('[UsersLoad] Failed to load users:', error);
		return {
			allUsers: [],
			currentUser: locals.user
		};
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdmin(locals.user);

		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();
		const confirm = data.get('confirmPassword')?.toString();
		const role = data.get('role')?.toString() as 'admin' | 'user' | null;

		if (!username || !password || !confirm || !role) {
			return fail(400, { error: 'Заполните все поля.' });
		}

		if (password !== confirm) {
			return fail(400, { error: 'Пароли не совпадают.' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Пароль должен содержать не менее 6 символов.' });
		}

		if (role !== 'admin' && role !== 'user') {
			return fail(400, { error: 'Некорректная роль.' });
		}

		try {
			const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);

			if (existing) {
				return fail(400, { error: 'Имя пользователя занято.' });
			}

			const passwordHash = await hashPassword(password);
			await db.insert(users).values({
				username,
				passwordHash,
				role
			});

			return { success: true };
		} catch (error) {
			console.error('[UsersCreate] Database error:', error);
			return fail(500, {
				error: normalizeError(error, 'Не удалось создать пользователя.')
			});
		}
	},

	delete: async ({ url, locals }) => {
		requireAdmin(locals.user);

		const id = Number(url.searchParams.get('id'));
		if (!id) {
			return fail(400, { error: 'Идентификатор пользователя не указан.' });
		}

		if (locals.user.userId === id) {
			return fail(400, { error: 'Нельзя удалить свой аккаунт.' });
		}

		try {
			await db.delete(users).where(eq(users.id, id));
			return { success: true };
		} catch (error) {
			console.error('[UsersDelete] Error deleting user:', error);
			return fail(500, {
				error: normalizeError(error, 'Не удалось удалить пользователя.')
			});
		}
	},

	updateUser: async ({ request, locals, cookies }) => {
		requireAdmin(locals.user);

		const data = await request.formData();
		const id = Number(data.get('id'));
		const username = data.get('username')?.toString().trim();
		const password = data.get('password')?.toString();
		const confirm = data.get('confirmPassword')?.toString();
		const role = data.get('role')?.toString() as 'admin' | 'user' | null;

		if (!id || !username || !role) {
			return fail(400, { error: 'Заполните все обязательные поля.' });
		}

		if (role !== 'admin' && role !== 'user') {
			return fail(400, { error: 'Некорректная роль.' });
		}

		if (password) {
			if (password !== confirm) {
				return fail(400, { error: 'Пароли не совпадают.' });
			}
			if (password.length < 6) {
				return fail(400, { error: 'Пароль должен содержать не менее 6 символов.' });
			}
		}

		try {
			const [existing] = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (existing && existing.id !== id) {
				return fail(400, { error: 'Имя пользователя занято.' });
			}

			const updateData: Partial<typeof users.$inferInsert> = { username, role };

			if (password) {
				updateData.passwordHash = await hashPassword(password);
			}

			await db.update(users).set(updateData).where(eq(users.id, id));

			if (id === locals.user.userId) {
				const token = cookies.get('session');
				if (token) updateSessionUsername(token, username);
			}

			return { success: true };
		} catch (error) {
			console.error('[UsersUpdateUser] Error updating user:', error);
			return fail(500, { error: normalizeError(error, 'Не удалось обновить пользователя.') });
		}
	},

	updateSelfPassword: async ({ request, locals }) => {
		requireAuth(locals.user);

		const data = await request.formData();
		const currentPassword = data.get('currentPassword')?.toString();
		const newPassword = data.get('newPassword')?.toString();
		const confirm = data.get('confirmPassword')?.toString();

		if (!currentPassword || !newPassword || !confirm) {
			return fail(400, { error: 'Заполните все поля.' });
		}

		if (newPassword !== confirm) {
			return fail(400, { error: 'Пароли не совпадают.' });
		}

		if (newPassword.length < 6) {
			return fail(400, { error: 'Пароль должен содержать не менее 6 символов.' });
		}

		try {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, locals.user.userId))
				.limit(1);

			if (!user) return fail(400, { error: 'Пользователь не найден.' });

			const valid = await verifyPassword(currentPassword, user.passwordHash);
			if (!valid) return fail(400, { error: 'Неверный текущий пароль.' });

			const passwordHash = await hashPassword(newPassword);
			await db.update(users).set({ passwordHash }).where(eq(users.id, locals.user.userId));

			return { success: true };
		} catch (error) {
			console.error('[UsersChangeSelfPassword] Error changing password:', error);
			return fail(500, { error: normalizeError(error, 'Не удалось изменить пароль.') });
		}
	},

	updateSelf: async ({ request, locals, cookies }) => {
		requireAuth(locals.user);

		const data = await request.formData();
		const username = data.get('username')?.toString().trim();
		const currentPassword = data.get('currentPassword')?.toString();

		if (!username || !currentPassword) {
			return fail(400, { error: 'Заполните все поля.' });
		}

		try {
			const [user] = await db
				.select()
				.from(users)
				.where(eq(users.id, locals.user.userId))
				.limit(1);

			if (!user) return fail(400, { error: 'Пользователь не найден.' });

			const valid = await verifyPassword(currentPassword, user.passwordHash);
			if (!valid) return fail(400, { error: 'Неверный текущий пароль.' });

			const [existing] = await db
				.select()
				.from(users)
				.where(eq(users.username, username))
				.limit(1);

			if (existing && existing.id !== locals.user.userId) {
				return fail(400, { error: 'Имя пользователя занято.' });
			}

			await db.update(users).set({ username }).where(eq(users.id, locals.user.userId));

			const token = cookies.get('session');
			if (token) updateSessionUsername(token, username);

			return { success: true };
		} catch (error) {
			console.error('[UsersUpdateSelf] Error updating self:', error);
			return fail(500, { error: normalizeError(error, 'Не удалось обновить имя пользователя.') });
		}
	}
};
