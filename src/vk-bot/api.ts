import { Hono } from 'hono';
import { vk } from './vk';
import { consumeLinkRequest, saveToken } from './db';
import { authKeyboard } from './keyboard';

interface ConfirmBody {
	code: string;
	token: string;
}

export const botApi = new Hono();

botApi.get('/health', (c) => c.json({ ok: true }));

botApi.post('/confirm-link', async (c) => {
	const body: ConfirmBody = await c.req.json();

	if (!body.code || !body.token) {
		return c.json({ error: 'Missing code or token' }, 400);
	}

	const request = consumeLinkRequest(body.code);

	if (!request) {
		return c.json({ error: 'Invalid or expired code' }, 400);
	}

	saveToken(request.vkId, body.token);

	try {
		await vk.api.messages.send({
			peer_id: request.vkId,
			message: 'Аккаунт успешно привязан!',
			random_id: Date.now(),
			keyboard: String(authKeyboard())
		});
	} catch (e) {
		console.error('[VK] failed to send success notification:', e);
	}

	return c.json({ success: true, vkId: request.vkId });
});
