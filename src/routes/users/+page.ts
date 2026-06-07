import type { PageLoad } from './$types';
import { ApiClient, ApiError } from '$shared/api/client';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
	const layout = await parent();
	const client = new ApiClient({ baseUrl: '', fetch });
	try {
		const data = await client.users.list();
		return { allUsers: data.users, currentUser: data.currentUser };
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		console.error('[UsersLoad] Failed to load users:', error);
		return { allUsers: [], currentUser: layout.user };
	}
};
