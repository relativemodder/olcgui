import type { ApiRequest } from './client';

export interface VkBotStatus {
	available: boolean;
}

export function createVkBotApi(request: ApiRequest) {
	return {
		status: () => request<VkBotStatus>('GET', '/api/vk-bot/status')
	};
}
