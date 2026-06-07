import type { ApiRequest } from './client';
import type { LoginRequest } from './requests';
import type { ApiUser, AuthMeResponse, SetupStatusResponse, SetupCreateResponse } from './types';

export interface LoginResult {
	token: string;
	user: ApiUser;
}

export function createAuthApi(request: ApiRequest) {
	return {
		login: (data: LoginRequest) =>
			request<LoginResult>('POST', '/api/auth/login', { body: data }),

		logout: () => request<void>('POST', '/api/auth/logout'),

		me: () =>
			request<AuthMeResponse>('GET', '/api/auth/me').then((r) => r.user),

		setupStatus: () =>
			request<SetupStatusResponse>('GET', '/api/setup/status').then((r) => r.setupNeeded),

		setupCreate: (data: { username: string; password: string; confirmPassword: string }) =>
			request<SetupCreateResponse>('POST', '/api/setup/', { body: data }),
	};
}
