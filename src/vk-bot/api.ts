import { Hono } from 'hono';
import { vk } from './vk';
import { consumeLinkRequest, saveToken } from './db';
import { authKeyboard } from './keyboard';

interface ConfirmBody {
	code: string;
	token: string;
}

export function normalizeConfirmBody(
	body: Partial<ConfirmBody> | null | undefined
): ConfirmBody | null {
	const code = body?.code?.trim();
	const token = body?.token?.trim();

	if (!code || !token) return null;
	if (!/^\d{6}$/.test(code)) return null;

	return { code, token };
}

export const botApi = new Hono();

botApi.get('/health', (c) => c.json({ ok: true }));

botApi.post('/confirm-link', async (c) => {
	const body = await c.req.json().catch(() => null);
	const normalized = normalizeConfirmBody(body);

	if (!normalized) {
		return c.json({ error: 'Invalid code or token' }, 400);
	}

	const request = consumeLinkRequest(normalized.code);

	if (!request) {
		return c.json({ error: 'Invalid or expired code' }, 400);
	}

	saveToken(request.vkId, normalized.token);

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
