import { ApiClient } from '../shared/api/client';
export { ApiClient, ApiError } from '../shared/api/client';
import { AUTH_COOKIE_NAME, parseCookie } from '../shared/utils';

function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	return parseCookie(document.cookie, name);
}

export function setAuthToken(token: string): void {
	document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24}`;
}

export function clearAuthToken(): void {
	document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export function authHeaders(initHeaders?: HeadersInit): Headers {
	const headers = new Headers(initHeaders);
	const token = getCookie(AUTH_COOKIE_NAME);
	if (token) headers.set('Authorization', `Bearer ${token}`);
	return headers;
}

export const api = new ApiClient({ baseUrl: '' });

export function createLoadClient(fetchFn: typeof fetch): ApiClient {
	return new ApiClient({ baseUrl: '', fetch: fetchFn });
}

export function formToJson(form: HTMLFormElement): Record<string, FormDataEntryValue | boolean> {
	const formData = new FormData(form);
	return Object.fromEntries(formData.entries());
}
