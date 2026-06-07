import { parseCookie } from '../shared/utils';

const API_BACKEND_URL = Bun.env.API_BACKEND_URL || 'http://localhost:3001';
export const AUTH_COOKIE_NAME = 'olcgui_token';

export function apiUrl(path: string): string {
	return new URL(path, API_BACKEND_URL).toString();
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(apiUrl(path), init);
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await apiFetch(path, init);
	if (!res.ok) {
		let message = `API request failed with ${res.status}`;
		try {
			const body = (await res.json()) as { error?: string };
			if (body.error) message = body.error;
		} catch {
			// keep fallback
		}
		throw new Error(message);
	}
	return (await res.json()) as T;
}

export function authHeadersFromCookie(cookie: string | null): HeadersInit {
	const token = cookie ? parseCookie(cookie, AUTH_COOKIE_NAME) : null;
	return token ? { authorization: `Bearer ${token}` } : {};
}
