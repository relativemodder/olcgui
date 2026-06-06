import { Hono } from 'hono';
import { db } from '../db/client';
import { users } from '../db/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { updateSessionsByUserId, updateSessionUsername } from '../auth/session';
import {
	ApiError,
	getAuthToken,
	json,
	parseJsonBody,
	requireAdmin,
	requireAuth,
	requireString
} from '../core';
import type { AppBindings } from '../app';
import { eq } from 'drizzle-orm';

export const usersRouter = new Hono<AppBindings>();

usersRouter.get('/', async (c) => {
	const user = requireAuth(c.get('user'));
	const allUsers =
		user.role === 'admin'
			? await db
					.select({
						id: users.id,
						username: users.username,
						role: users.role,
						createdAt: users.createdAt
					})
					.from(users)
			: [];
	return json({ allUsers, currentUser: user });
});

usersRouter.post('/', async (c) => {
	requireAdmin(c.get('user'));
	const body = await parseJsonBody<{
		username?: string;
		password?: string;
		confirmPassword?: string;
		role?: string;
	}>(c.req.raw);
	const username = requireString(body.username, 'Заполните все поля.');
	const password = body.password;
	const confirm = body.confirmPassword;
	const role = body.role;
	if (!password || !confirm || !role) throw new ApiError(400, 'Заполните все поля.');
	if (password !== confirm) throw new ApiError(400, 'Пароли не совпадают.');
	if (password.length < 6) throw new ApiError(400, 'Пароль должен содержать не менее 6 символов.');
	if (role !== 'admin' && role !== 'user') throw new ApiError(400, 'Некорректная роль.');

	const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
	if (existing) throw new ApiError(400, 'Имя пользователя занято.');

	await db.insert(users).values({ username, passwordHash: await hashPassword(password), role });
	return json({ success: true }, 201);
});

usersRouter.patch('/self', async (c) => {
	const user = requireAuth(c.get('user'));
	const body = await parseJsonBody<{ username?: string; currentPassword?: string }>(c.req.raw);
	const username = requireString(body.username, 'Заполните все поля.');
	const currentPassword = body.currentPassword;
	if (!currentPassword) throw new ApiError(400, 'Заполните все поля.');

	const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
	if (!dbUser) throw new ApiError(400, 'Пользователь не найден.');
	if (!(await verifyPassword(currentPassword, dbUser.passwordHash)))
		throw new ApiError(400, 'Неверный текущий пароль.');

	const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
	if (existing && existing.id !== user.userId) throw new ApiError(400, 'Имя пользователя занято.');

	await db.update(users).set({ username }).where(eq(users.id, user.userId));
	const token = getAuthToken(c.req.raw);
	if (token) await updateSessionUsername(token, username);
	return json({ success: true });
});

usersRouter.patch('/self-password', async (c) => {
	const user = requireAuth(c.get('user'));
	const body = await parseJsonBody<{
		currentPassword?: string;
		newPassword?: string;
		confirmPassword?: string;
	}>(c.req.raw);
	if (!body.currentPassword || !body.newPassword || !body.confirmPassword)
		throw new ApiError(400, 'Заполните все поля.');
	if (body.newPassword !== body.confirmPassword) throw new ApiError(400, 'Пароли не совпадают.');
	if (body.newPassword.length < 6)
		throw new ApiError(400, 'Пароль должен содержать не менее 6 символов.');

	const [dbUser] = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
	if (!dbUser) throw new ApiError(400, 'Пользователь не найден.');
	if (!(await verifyPassword(body.currentPassword, dbUser.passwordHash)))
		throw new ApiError(400, 'Неверный текущий пароль.');

	await db
		.update(users)
		.set({ passwordHash: await hashPassword(body.newPassword) })
		.where(eq(users.id, user.userId));
	return json({ success: true });
});

usersRouter.patch('/:id', async (c) => {
	const admin = requireAdmin(c.get('user'));
	const routeId = Number(c.req.param('id'));
	const body = await parseJsonBody<{
		username?: string;
		password?: string;
		confirmPassword?: string;
		role?: string;
	}>(c.req.raw);
	const username = requireString(body.username, 'Заполните все обязательные поля.');
	const role = body.role;
	if (role !== 'admin' && role !== 'user') throw new ApiError(400, 'Некорректная роль.');
	if (body.password) {
		if (body.password !== body.confirmPassword) throw new ApiError(400, 'Пароли не совпадают.');
		if (body.password.length < 6)
			throw new ApiError(400, 'Пароль должен содержать не менее 6 символов.');
	}

	const [existing] = await db.select().from(users).where(eq(users.username, username)).limit(1);
	if (existing && existing.id !== routeId) throw new ApiError(400, 'Имя пользователя занято.');

	const updateData: Partial<typeof users.$inferInsert> = { username, role };
	if (body.password) updateData.passwordHash = await hashPassword(body.password);
	await db.update(users).set(updateData).where(eq(users.id, routeId));
	await updateSessionsByUserId(routeId, { username, role });

	const token = getAuthToken(c.req.raw);
	if (routeId === admin.userId && token) await updateSessionUsername(token, username);
	return json({ success: true });
});

usersRouter.delete('/:id', async (c) => {
	const admin = requireAdmin(c.get('user'));
	const routeId = Number(c.req.param('id'));
	if (admin.userId === routeId) throw new ApiError(400, 'Нельзя удалить свой аккаунт.');
	await db.delete(users).where(eq(users.id, routeId));
	return json({ success: true });
});
