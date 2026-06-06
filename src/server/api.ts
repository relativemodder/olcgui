import { createApp } from './app';

const port = Number(process.env.API_PORT || 3001);
const hostname = process.env.API_HOST || process.env.HOST || 'localhost';

const app = await createApp();

Bun.serve({
	port,
	hostname,
	fetch: app.fetch
});

console.log(`[API] Hono backend listening on http://${hostname}:${port}`);
