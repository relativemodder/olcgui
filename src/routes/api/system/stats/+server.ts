import { json, type RequestHandler } from '@sveltejs/kit';
import { getSystemStats } from '$lib/server/process/systemStats';
import { requireAuth } from '$lib/server/auth/guards';

export const GET: RequestHandler = async ({ locals }) => {
	requireAuth(locals.user);

	const stats = await getSystemStats();
	return json(stats);
};
