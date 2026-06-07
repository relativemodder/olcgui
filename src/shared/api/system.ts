import type { ApiRequest } from './client';
import type { SystemStatsDto } from './types';

export function createSystemApi(request: ApiRequest) {
	return {
		stats: () => request<SystemStatsDto>('GET', '/api/system/stats')
	};
}
