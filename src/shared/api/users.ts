import type { ApiRequest } from './client';
import type { CreateUserRequest, UpdateUserRequest, UpdateSelfRequest, UpdateSelfPasswordRequest } from './requests';
import type { UserListItem, ApiUser, UsersResponse } from './types';

export function createUsersApi(request: ApiRequest) {
	return {
		list: () =>
			request<UsersResponse>('GET', '/api/users').then((r) => ({
				users: r.allUsers,
				currentUser: r.currentUser,
			})),

		create: (data: CreateUserRequest) =>
			request<void>('POST', '/api/users', { body: data }),

		updateSelf: (data: UpdateSelfRequest) =>
			request<void>('PATCH', '/api/users/self', { body: data }),

		updateSelfPassword: (data: UpdateSelfPasswordRequest) =>
			request<void>('PATCH', '/api/users/self-password', { body: data }),

		update: (id: number, data: UpdateUserRequest) =>
			request<void>('PATCH', `/api/users/${id}`, { body: data }),

		remove: (id: number) =>
			request<void>('DELETE', `/api/users/${id}`),
	};
}
