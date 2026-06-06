import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_BACKEND_URL = env.API_BACKEND_URL || 'http://localhost:3001';

const proxy: RequestHandler = async (event) => {
	const target = new URL(`/api/${event.params.path}`, API_BACKEND_URL);
	target.search = event.url.search;

	const headers = new Headers(event.request.headers);
	headers.delete('host');
	headers.delete('content-length');

	const init: RequestInit = {
		method: event.request.method,
		headers,
		redirect: 'manual'
	};

	if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		init.body = await event.request.arrayBuffer();
	}

	return fetch(target, init);
};

export const GET: RequestHandler = proxy;
export const POST: RequestHandler = proxy;
export const PUT: RequestHandler = proxy;
export const PATCH: RequestHandler = proxy;
export const DELETE: RequestHandler = proxy;
export const OPTIONS: RequestHandler = proxy;
export const HEAD: RequestHandler = proxy;
