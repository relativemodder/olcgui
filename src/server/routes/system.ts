import { Hono } from 'hono';
import { getSystemStats } from '../process/systemStats';
import { json, requireAuth } from '../core';
import type { AppBindings } from '../app';

export const systemRouter = new Hono<AppBindings>();

systemRouter.get('/stats', async (c) => {
	requireAuth(c.get('user'));
	return json(await getSystemStats());
});
