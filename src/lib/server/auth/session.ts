import { randomBytes } from 'crypto';
import type { Cookies } from '@sveltejs/kit';

export interface Session {
	userId: number;
	username: string;
	role: 'admin' | 'user';
	expiresAt: number;
}

const sessionsStore = new Map<string, Session>();

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24;

export function createSession(userId: number, username: string, role: 'admin' | 'user'): string {
	const token = randomBytes(32).toString('hex');
	const expiresAt = Date.now() + SESSION_DURATION_MS;
	sessionsStore.set(token, { userId, username, role, expiresAt });
	return token;
}

export function getSession(token: string | null | undefined): Session | null {
	if (!token) return null;
	const session = sessionsStore.get(token);
	if (!session) return null;

	if (Date.now() > session.expiresAt) {
		sessionsStore.delete(token);
		return null;
	}
	return session;
}

export function updateSessionUsername(token: string, newUsername: string): void {
	const session = sessionsStore.get(token);
	if (session) {
		sessionsStore.set(token, { ...session, username: newUsername });
	}
}

export function updateSessionRole(token: string, newRole: 'admin' | 'user'): void {
	const session = sessionsStore.get(token);
	if (session) {
		sessionsStore.set(token, { ...session, role: newRole });
	}
}

export function updateSessionsByUserId(userId: number, updates: Partial<Pick<Session, 'username' | 'role'>>): void {
	for (const [token, session] of sessionsStore.entries()) {
		if (session.userId === userId) {
			sessionsStore.set(token, { ...session, ...updates });
		}
	}
}

export function destroySession(token: string | null | undefined): void {
	if (token) {
		sessionsStore.delete(token);
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
		() => {
			const now = Date.now();
			for (const [token, session] of sessionsStore.entries()) {
				if (now > session.expiresAt) {
					sessionsStore.delete(token);
				}
			}
		},
		1000 * 60 * 30
	);
}
