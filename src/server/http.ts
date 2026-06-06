const API_BACKEND_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';
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

function readCookie(rawCookie: string | null, name: string): string | null {
	if (!rawCookie) return null;
	for (const part of rawCookie.split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (decodeURIComponent(key) === name) return decodeURIComponent(value.join('='));
	}
	return null;
}

export function authHeadersFromCookie(cookie: string | null): HeadersInit {
	const token = readCookie(cookie, AUTH_COOKIE_NAME);
	return token ? { authorization: `Bearer ${token}` } : {};
}
