import { eq } from 'drizzle-orm';
import { db } from './db/client';
import { instances, users } from './db/schema';
import type { Session } from './auth/session';
import { AUTH_COOKIE_NAME } from './http';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8'
		}
	});
}

export function normalizeError(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}

export function getAuthToken(req: Request): string | null {
	const auth = req.headers.get('authorization');
	if (auth?.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim();

	const cookie = req.headers.get('cookie');
	if (!cookie) return null;
	for (const part of cookie.split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (decodeURIComponent(key) === AUTH_COOKIE_NAME) return decodeURIComponent(value.join('='));
	}
	return null;
}

export function requireAuth(user: Session | null): Session {
	if (!user) throw new ApiError(401, 'Не авторизован.');
	return user;
}

export function requireAdmin(user: Session | null): Session {
	const activeUser = requireAuth(user);
	if (activeUser.role !== 'admin') {
		throw new ApiError(403, 'Только администраторы могут выполнять это действие.');
	}
	return activeUser;
}

export function canAccessInstance(user: Session, ownerId: number | null): boolean {
	return user.role === 'admin' || ownerId === user.userId;
}

export async function isSetupNeeded(): Promise<boolean> {
	const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
	return existingUsers.length === 0;
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
	try {
		return (await req.json()) as T;
	} catch {
		throw new ApiError(400, 'Некорректный JSON body.');
	}
}

export function requireString(value: unknown, message: string): string {
	if (typeof value !== 'string' || !value.trim()) throw new ApiError(400, message);
	return value.trim();
}

export async function requireAccessibleInstance(user: Session, id: number) {
	const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
	if (!inst) throw new ApiError(404, 'Инстанс не найден.');
	if (!canAccessInstance(user, inst.userId)) throw new ApiError(403, 'Нет доступа.');
	return inst;
}
