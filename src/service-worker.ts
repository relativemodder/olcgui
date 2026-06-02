import { build, files, version } from '$service-worker';

const worker = self as unknown as ServiceWorkerGlobalScope;

const PRECACHE = `precache-${version}`;
const RUNTIME = `runtime-${version}`;
const CACHE_NAMES = new Set([PRECACHE, RUNTIME]);
const ASSETS = Array.from(new Set([...build, ...files]));
const ASSET_PATHS = new Set(ASSETS);

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(PRECACHE)
			.then((cache) => Promise.all(ASSETS.map((asset) => cache.add(asset).catch(() => undefined))))
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((names) =>
				Promise.all(names.filter((name) => !CACHE_NAMES.has(name)).map((name) => caches.delete(name)))
			)
			.then(() => worker.clients.claim())
	);
});

worker.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.method !== 'GET' || url.origin !== worker.location.origin) {
		return;
	}

	if (ASSET_PATHS.has(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(networkFirstNavigation(request));
		return;
	}

	if (url.pathname.startsWith('/api/')) {
		return;
	}

	event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request: Request) {
	const cached = await caches.match(request);

	if (cached) {
		return cached;
	}

	const response = await fetch(request);
	const cache = await caches.open(PRECACHE);
	cache.put(request, response.clone());

	return response;
}

async function networkFirstNavigation(request: Request) {
	const cache = await caches.open(RUNTIME);

	try {
		const response = await fetch(request);

		if (response.ok) {
			cache.put(request, response.clone());
		}

		return response;
	} catch {
		return (await cache.match(request)) ?? (await cache.match('/')) ?? offlineResponse();
	}
}

async function staleWhileRevalidate(request: Request) {
	const cache = await caches.open(RUNTIME);
	const cached = await cache.match(request);
	const fetched = fetch(request)
		.then((response) => {
			if (response.ok) {
				cache.put(request, response.clone()).catch(() => undefined);
			}

			return response;
		})
		.catch(() => cached ?? offlineResponse(request));

	return cached ?? fetched;
}

function offlineResponse(request?: Request) {
	const acceptsHtml = request?.headers.get('accept')?.includes('text/html') ?? true;

	if (!acceptsHtml) {
		return new Response('', {
			status: 503,
			statusText: 'Service Unavailable'
		});
	}

	return new Response(
		'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>olcRTC GUI offline</title></head><body><h1>olcRTC GUI недоступен офлайн</h1><p>Подключитесь к серверу и обновите страницу.</p></body></html>',
		{
			status: 503,
			headers: {
				'content-type': 'text/html; charset=utf-8'
			}
		}
	);
}
