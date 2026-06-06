import { randomBytes } from 'crypto';
import type { Cookies } from '@sveltejs/kit';
import { db } from '../db/client';
import { sessions } from '../db/schema';
import { eq, lt } from 'drizzle-orm';

export interface Session {
	userId: number;
	username: string;
	role: 'admin' | 'user';
	expiresAt: number;
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24;

export async function createSession(
	userId: number,
	username: string,
	role: 'admin' | 'user'
): Promise<string> {
	const token = randomBytes(32).toString('hex');
	const expiresAt = Date.now() + SESSION_DURATION_MS;
	await db.insert(sessions).values({ token, userId, username, role, expiresAt });
	return token;
}

export async function getSession(token: string | null | undefined): Promise<Session | null> {
	if (!token) return null;
	const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
	if (!session) return null;

	if (Date.now() > session.expiresAt) {
		await db.delete(sessions).where(eq(sessions.token, token));
		return null;
	}
	return {
		userId: session.userId,
		username: session.username,
		role: session.role,
		expiresAt: session.expiresAt
	};
}

export async function updateSessionUsername(token: string, newUsername: string): Promise<void> {
	await db.update(sessions).set({ username: newUsername }).where(eq(sessions.token, token));
}

export async function updateSessionRole(token: string, newRole: 'admin' | 'user'): Promise<void> {
	await db.update(sessions).set({ role: newRole }).where(eq(sessions.token, token));
}

export async function updateSessionsByUserId(
	userId: number,
	updates: Partial<Pick<Session, 'username' | 'role'>>
): Promise<void> {
	await db.update(sessions).set(updates).where(eq(sessions.userId, userId));
}

export async function destroySession(token: string | null | undefined): Promise<void> {
	if (token) {
		await db.delete(sessions).where(eq(sessions.token, token));
	}
}

export function setSessionCookie(cookies: Cookies, token: string): void {
	cookies.set('session', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24
	});
}

if (typeof globalThis !== 'undefined') {
	setInterval(
		async () => {
			await db.delete(sessions).where(lt(sessions.expiresAt, Date.now()));
		},
		1000 * 60 * 30
	);
}
