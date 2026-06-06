const AUTH_COOKIE_NAME = 'olcgui_token';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	for (const part of document.cookie.split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (decodeURIComponent(key) === name) return decodeURIComponent(value.join('='));
	}
	return null;
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
	if (token) headers.set('authorization', `Bearer ${token}`);
	return headers;
}

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
	return fetch(path, { ...init, headers: authHeaders(init.headers) });
}

export async function readApiError(res: Response, fallback: string): Promise<string> {
	try {
		const data = (await res.json()) as { error?: string };
		return data.error || fallback;
	} catch {
		return fallback;
	}
}

export async function apiJson<T>(
	fetchFn: typeof fetch,
	path: string,
	init: RequestInit = {}
): Promise<T> {
	const res = await fetchFn(path, { ...init, headers: authHeaders(init.headers) });
	if (!res.ok)
		throw new ApiError(
			res.status,
			await readApiError(res, `API request failed with ${res.status}`)
		);
	return (await res.json()) as T;
}

export function formToJson(form: HTMLFormElement): Record<string, FormDataEntryValue | boolean> {
	const formData = new FormData(form);
	return Object.fromEntries(formData.entries());
}
