import { json, type RequestHandler } from '@sveltejs/kit';
import { getRepoSyncing } from '$lib/server/git/repo';

export const GET: RequestHandler = async () => {
	return json({ repoSyncing: getRepoSyncing() });
};
