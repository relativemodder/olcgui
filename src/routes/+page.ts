import type { PageLoad } from './$types';
import { ApiClient, ApiError } from '$shared/api/client';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
	const layout = await parent();
	const client = new ApiClient({ baseUrl: '', fetch });
	try {
		const instances = await client.instances.list();
		return { instances, user: layout.user };
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		throw error;
	}
};
