import type { PageLoad } from './$types';
import { ApiError, apiJson } from '$lib/api';
import type { InstancesResponse } from '$shared/api/types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent }) => {
	const layout = await parent();
	let data: InstancesResponse;
	try {
		data = await apiJson<InstancesResponse>(fetch, '/api/instances');
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		throw error;
	}

	return {
		instances: data.instances,
		user: layout.user
	};
};
