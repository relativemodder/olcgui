import { redirect, type Handle } from '@sveltejs/kit';
import { ApiClient } from '$shared/api/client';
import { AUTH_COOKIE_NAME, parseCookie } from '$shared/utils';
import type { ApiUser } from '$shared/api/types';

const API_BACKEND_URL = Bun.env.API_BACKEND_URL || 'http://localhost:3001';

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie');
	let activeSession: ApiUser | null = null;
	let isSetupNeeded = false;

	try {
		const token = cookie ? (parseCookie(cookie, AUTH_COOKIE_NAME) ?? undefined) : undefined;
		const client = new ApiClient({ baseUrl: API_BACKEND_URL, token });
		const [user, setupNeeded] = await Promise.all([client.auth.me(), client.auth.setupStatus()]);
		activeSession = user;
		isSetupNeeded = setupNeeded;
	} catch (error) {
		console.error('[Hooks] API auth/setup check failed:', error);
	}

	event.locals.user = activeSession
		? {
				userId: activeSession.userId,
				username: activeSession.username,
				role: activeSession.role
			}
		: null;

	event.locals.setupNeeded = isSetupNeeded;

	const { pathname } = event.url;

	if (event.locals.setupNeeded) {
		if (pathname !== '/setup' && !pathname.startsWith('/api')) {
			throw redirect(302, '/setup');
		}
	} else {
		if (pathname === '/setup') {
			throw redirect(302, '/');
		}

		if (!event.locals.user) {
			if (pathname !== '/login' && !pathname.startsWith('/api')) {
				throw redirect(302, '/login');
			}
		} else {
			if (pathname === '/login' && event.request.method === 'GET') {
				throw redirect(302, '/');
			}
		}
	}

	return resolve(event);
};
