import { createApp } from './app';

const port = Number(Bun.env.API_PORT || 3001);
const hostname = Bun.env.API_HOST || Bun.env.HOST || 'localhost';

const app = await createApp();

Bun.serve({
	port,
	hostname,
	fetch: app.fetch
});

console.log(`[API] Hono backend listening on http://${hostname}:${port}`);
