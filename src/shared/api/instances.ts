import type { ApiRequest } from './client';
import type { CreateInstanceRequest, UpdateInstanceRequest } from './requests';
import type {
	InstanceDto,
	InstanceResponse,
	InstancesResponse,
	InstanceStatus,
} from './types';

export interface InstanceStatusLogs {
	status: InstanceStatus;
	logs: string[];
}

export function createInstancesApi(request: ApiRequest) {
	return {
		list: () =>
			request<InstancesResponse>('GET', '/api/instances').then((r) => r.instances),

		getStatus: (id: number) =>
			request<InstanceStatusLogs>('GET', `/api/instances?id=${id}`),

		get: (id: number) =>
			request<InstanceResponse>('GET', `/api/instances/${id}`).then((r) => r.instance),

		create: (data: CreateInstanceRequest) =>
			request<InstanceResponse>('POST', '/api/instances', { body: data }).then(
				(r) => r.instance,
			),

		update: (id: number, data: UpdateInstanceRequest) =>
			request<void>('PATCH', `/api/instances/${id}`, { body: data }),

		start: (id: number) =>
			request<void>('POST', `/api/instances/${id}/start`),

		stop: (id: number) =>
			request<void>('POST', `/api/instances/${id}/stop`),

		restart: (id: number) =>
			request<void>('POST', `/api/instances/${id}/restart`),

		toggleAutoRestart: (id: number) =>
			request<{ autoRestart: boolean }>(
				'PATCH',
				`/api/instances/${id}/auto-restart`,
			).then((r) => r.autoRestart),

		remove: (id: number) =>
			request<void>('DELETE', `/api/instances/${id}`),
	};
}
