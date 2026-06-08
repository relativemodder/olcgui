import { ApiClient } from '../shared/api';
import type { Database } from 'bun:sqlite';

export const VK_TOKEN = process.env.VK_TOKEN || '';
export const VK_GROUP_ID = process.env.VK_GROUP_ID || '';
export const API_BACKEND_URL = process.env.API_BACKEND_URL || 'http://api:3001';
export const DB_PATH = process.env.VK_BOT_DB_PATH || 'data/vk-bot.db';
export const BOT_HTTP_PORT = parseInt(process.env.BOT_HTTP_PORT || '3002', 10);

export function createApiClient(baseUrl: string, token?: string): ApiClient {
	return new ApiClient({ baseUrl, token });
}

export function createAuthedApiClient(db: Database, vkId: number): ApiClient | null {
	const row = db
		.query<{ api_token: string }, number>('SELECT api_token FROM users WHERE vk_id = ?')
		.get(vkId);

	if (!row) return null;

	return createApiClient(API_BACKEND_URL, row.api_token);
}
