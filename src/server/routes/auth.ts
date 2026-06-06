import { Hono } from 'hono';
import { db } from '../db/client';
import { users } from '../db/schema';
import { verifyPassword } from '../auth/password';
import { createSession, destroySession } from '../auth/session';
import { json, parseJsonBody, ApiError, getAuthToken } from '../core';
import type { AppBindings } from '../app';
import { eq } from 'drizzle-orm';

export const authRouter = new Hono<AppBindings>();

authRouter.get('/me', (c) => json({ user: c.get('user') }));

authRouter.post('/login', async (c) => {
	const body = await parseJsonBody<{ username?: string; password?: string }>(c.req.raw);
	const username = body.username?.trim();
	const password = body.password;

	if (!username || !password) throw new ApiError(400, 'Введите логин и пароль.');

	const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		throw new ApiError(400, 'Неверный логин или пароль.');
	}

	const token = await createSession(user.id, user.username, user.role);
	return json({ token, user: { userId: user.id, username: user.username, role: user.role } });
});

authRouter.post('/logout', async (c) => {
	await destroySession(getAuthToken(c.req.raw));
	return json({ success: true });
});
