import type { PageLoad } from './$types';
import { ApiError, apiJson } from '$lib/api';
import type { UsersResponse } from '$shared/api/types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
	const layout = await parent();
	try {
		return await apiJson<UsersResponse>(fetch, '/api/users');
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		console.error('[UsersLoad] Failed to load users:', error);
		return {
			allUsers: [],
			currentUser: layout.user
		};
	}
};
