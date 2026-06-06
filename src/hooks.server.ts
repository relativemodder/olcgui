import { redirect, type Handle } from '@sveltejs/kit';
import { apiJson, authHeadersFromCookie } from '$server/http';
import type { AuthMeResponse, ApiUser, SetupStatusResponse } from '$shared/api/types';

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie');
	let activeSession: ApiUser | null = null;
	let isSetupNeeded = false;

	try {
		const authHeaders = authHeadersFromCookie(cookie);
		const [auth, setup] = await Promise.all([
			apiJson<AuthMeResponse>('/api/auth/me', { headers: authHeaders }),
			apiJson<SetupStatusResponse>('/api/setup/status', { headers: authHeaders })
		]);
		activeSession = auth.user;
		isSetupNeeded = setup.setupNeeded;
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
