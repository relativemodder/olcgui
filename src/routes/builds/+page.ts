import type { PageLoad } from './$types';
import { ApiClient, ApiError } from '$shared/api/client';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
	const layout = await parent();
	const client = new ApiClient({ baseUrl: '', fetch });
	try {
		const data = await client.repo.info();
		return { ...data, isAdmin: layout.user?.role === 'admin' };
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		console.error('[BuildsLoad] Error loading git info:', error);
		return {
			branches: [],
			currentBranchName: 'master',
			currentCommit: null,
			isAdmin: layout.user?.role === 'admin'
		};
	}
};
