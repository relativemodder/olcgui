import { Hono } from 'hono';
import { setupDatabase } from './db/setup';
import { ensureOlcrtcRepo, isOlcrtcRepoReady } from './git/repo';
import { initProcessManager } from './process/manager';
import { authRouter } from './routes/auth';
import { setupRouter } from './routes/setup';
import { instancesRouter } from './routes/instances';
import { buildsRouter } from './routes/builds';
import { repoRouter } from './routes/repo';
import { usersRouter } from './routes/users';
import { systemRouter } from './routes/system';
import { eventsRouter } from './routes/events';
import { getSession, type Session } from './auth/session';
import { ApiError, json, normalizeError, getAuthToken, isSetupNeeded } from './core';

export interface AppBindings {
	Variables: {
		user: Session | null;
		setupNeeded: boolean;
	};
}

async function bootstrap() {
	await setupDatabase();
	if (!isOlcrtcRepoReady()) await ensureOlcrtcRepo();
	await initProcessManager();
}

export async function createApp() {
	await bootstrap();

	const app = new Hono<AppBindings>();

	app.use('/api/*', async (c, next) => {
		c.set('user', await getSession(getAuthToken(c.req.raw)));
		c.set('setupNeeded', await isSetupNeeded());
		return next();
	});

	app.route('/api/auth', authRouter);
	app.route('/api/setup', setupRouter);
	app.route('/api/instances', instancesRouter);
	app.route('/api/builds', buildsRouter);
	app.route('/api/repo', repoRouter);
	app.route('/api/users', usersRouter);
	app.route('/api/system', systemRouter);
	app.route('/api/events', eventsRouter);

	app.get('/api', () => json({ error: 'Not found.' }, 404));
	app.notFound((_) => json({ error: 'API endpoint not found.' }, 404));
	app.onError((err, c) => {
		if (err instanceof ApiError)
			return c.json({ error: err.message }, err.status as 400 | 401 | 403 | 404 | 500);
		console.error('[API] Request failed:', err);
		return c.json({ error: normalizeError(err, 'Internal server error.') }, 500);
	});

	return app;
}
