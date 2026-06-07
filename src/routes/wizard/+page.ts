import type { PageLoad } from './$types';
import { ApiClient, ApiError } from '$shared/api/client';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, parent, url }) => {
	const layout = await parent();
	const client = new ApiClient({ baseUrl: '', fetch });
	let allUsers: { id: number; username: string; role: 'admin' | 'user'; createdAt?: string | Date }[];
	try {
		const data = await client.users.list();
		allUsers = data.users;
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) throw redirect(302, '/login');
		throw error;
	}

	let editInstance = null;
	const editId = url.searchParams.get('edit');
	if (editId) {
		editInstance = await client.instances.get(Number(editId));
	}

	return {
		editInstance,
		allUsers,
		isAdmin: layout.user?.role === 'admin',
		currentUserId: layout.user?.userId
	};
};
