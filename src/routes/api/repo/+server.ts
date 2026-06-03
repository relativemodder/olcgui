import { json, type RequestHandler } from '@sveltejs/kit';
import { getRepoSyncing } from '$lib/server/git/repo';
import { requireAdmin } from '$lib/server/auth/guards';

export const GET: RequestHandler = async ({ locals }) => {
	requireAdmin(locals.user);
	return json({ repoSyncing: getRepoSyncing() });
};
