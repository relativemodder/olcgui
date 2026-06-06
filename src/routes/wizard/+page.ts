import type { PageLoad } from './$types';
import { ApiError, apiJson } from '$lib/api';
import type { InstanceResponse, UsersResponse } from '$shared/api/types';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent, url }) => {
	const layout = await parent();
	let usersData: Pick<UsersResponse, 'allUsers'>;
	try {
		usersData = await apiJson<Pick<UsersResponse, 'allUsers'>>(fetch, '/api/users');
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		throw error;
	}

	let editInstance: InstanceResponse['instance'] | null = null;
	const editId = url.searchParams.get('edit');
	if (editId) {
		const data = await apiJson<InstanceResponse>(fetch, `/api/instances/${editId}`);
		editInstance = data.instance;
	}

	return {
		editInstance,
		allUsers: usersData.allUsers,
		isAdmin: layout.user?.role === 'admin',
		currentUserId: layout.user?.userId
	};
};
