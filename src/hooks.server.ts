import { db } from '$lib/server/db/client';
import { setupDatabase } from '$lib/server/db/setup';
import { initProcessManager } from '$lib/server/process/manager';
import { users } from '$lib/server/db/schema';
import { getSession } from '$lib/server/auth/session';
import { redirect, type Handle } from '@sveltejs/kit';

let dbInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized) {
		try {
			await setupDatabase();
			await initProcessManager();
			dbInitialized = true;
		} catch (error) {
			console.error('[Hooks] Startup DB setup failed:', error);
		}
	}

	const sessionToken = event.cookies.get('session');
	const activeSession = getSession(sessionToken);

	event.locals.user = activeSession
		? {
				userId: activeSession.userId,
				username: activeSession.username,
				role: activeSession.role
			}
		: null;

	let isSetupNeeded: boolean;
	try {
		const existingUsers = await db.select().from(users).limit(1);
		isSetupNeeded = existingUsers.length === 0;
	} catch (err) {
		console.error('[Hooks] User check failed, assuming setup NOT needed to prevent loops:', err);
		isSetupNeeded = false;
	}
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
