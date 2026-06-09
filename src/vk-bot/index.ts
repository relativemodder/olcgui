import { VK_TOKEN, BOT_HTTP_PORT } from './config';
import { vk } from './vk';
import { getDb } from './db';
import { createHandlers, handleMessage } from './handlers';
import { botApi } from './api';
import { registerFlow } from './flows/index';
import { loginFlow } from './flows/login';
import { createCreateFlow } from './flows/create-instance';
import { createDeleteFlow } from './flows/delete-instance';

const db = getDb();

registerFlow(loginFlow);
registerFlow(createCreateFlow(db));
registerFlow(createDeleteFlow(db));

const commands = createHandlers(db);

vk.updates.on('message_new', async (context) => {
	console.log('[VK] message from', context.senderId, ':', context.text);
	await handleMessage(context, commands);
});

let server: ReturnType<typeof Bun.serve> | null = null;

async function shutdown(signal: string) {
	console.log(`[VK] received ${signal}, shutting down...`);
	try {
		await vk.updates.stop();
	} catch (e) {
		console.error('[VK] error stopping updates:', e);
	}
	server?.stop();
	process.exit(0);
}

async function main() {
	if (!VK_TOKEN) {
		console.error('VK_TOKEN is not set');
		process.exit(1);
	}

	process.on('SIGTERM', () => shutdown('SIGTERM'));
	process.on('SIGINT', () => shutdown('SIGINT'));

	server = Bun.serve({
		fetch: botApi.fetch,
		port: BOT_HTTP_PORT
	});
	console.log(`Bot HTTP API listening on :${BOT_HTTP_PORT}`);

	await vk.updates.startPolling();

	console.log('VK bot started');
}

main().catch((err) => {
	console.error('VK bot failed:', err);
	process.exit(1);
});
