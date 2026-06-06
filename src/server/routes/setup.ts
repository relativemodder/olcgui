import { Hono } from 'hono';
import { db } from '../db/client';
import { settings, users } from '../db/schema';
import { hashPassword } from '../auth/password';
import { createSession } from '../auth/session';
import { isSetupNeeded, json, parseJsonBody, requireString, ApiError } from '../core';
import type { AppBindings } from '../app';
import { eq } from 'drizzle-orm';

export const setupRouter = new Hono<AppBindings>();

setupRouter.get('/status', async () => json({ setupNeeded: await isSetupNeeded() }));

setupRouter.post('/', async (c) => {
	if (!(await isSetupNeeded())) throw new ApiError(400, 'Администратор уже создан.');

	const body = await parseJsonBody<{
		username?: string;
		password?: string;
		confirmPassword?: string;
	}>(c.req.raw);
	const username = requireString(body.username, 'Все поля обязательны для заполнения.');
	const password = body.password;
	const confirmPassword = body.confirmPassword;

	if (!password || !confirmPassword)
		throw new ApiError(400, 'Все поля обязательны для заполнения.');
	if (username.length < 3)
		throw new ApiError(400, 'Имя пользователя должно содержать не менее 3 символов.');
	if (password.length < 6) throw new ApiError(400, 'Пароль должен содержать не менее 6 символов.');
	if (password !== confirmPassword) throw new ApiError(400, 'Введенные пароли не совпадают.');

	const passwordHash = await hashPassword(password);
	const [newAdmin] = await db
		.insert(users)
		.values({ username, passwordHash, role: 'admin' })
		.returning();

	try {
		await db.insert(settings).values({ key: 'setup_done', value: '1' });
	} catch {
		await db.delete(users).where(eq(users.id, newAdmin.id));
		throw new ApiError(400, 'Администратор уже создан.');
	}

	const token = await createSession(newAdmin.id, newAdmin.username, newAdmin.role);
	return json({
		token,
		user: { userId: newAdmin.id, username: newAdmin.username, role: newAdmin.role }
	});
});
