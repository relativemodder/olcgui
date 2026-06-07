import type { ApiRequest } from './client';
import type { RepoSyncResponse, RepoInfoResponse } from './types';
import type { CheckoutBranchRequest } from './requests';

export function createRepoApi(request: ApiRequest) {
	return {
		status: () =>
			request<RepoSyncResponse>('GET', '/api/repo').then((r) => r.repoSyncing),

		info: () =>
			request<RepoInfoResponse>('GET', '/api/repo/info'),

		pull: () =>
			request<void>('POST', '/api/repo/pull'),

		checkout: (data: CheckoutBranchRequest) =>
			request<void>('POST', '/api/repo/checkout', { body: data }),
	};
}
