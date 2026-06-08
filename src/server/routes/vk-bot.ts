import { Hono } from 'hono';
import { json, parseJsonBody, ApiError, requireAuth, getAuthToken } from '../core';
import type { AppBindings } from '../app';

const VK_BOT_URL = process.env.VK_BOT_URL || 'http://vk-bot:3002';

export const vkBotRouter = new Hono<AppBindings>();

vkBotRouter.get('/status', async (_c) => {
	try {
		const res = await fetch(`${VK_BOT_URL}/health`, {
			signal: AbortSignal.timeout(3000)
		});
		return json({ available: res.ok });
	} catch {
		return json({ available: false });
	}
});

vkBotRouter.post('/confirm', async (c) => {
	requireAuth(c.get('user'));
	const token = getAuthToken(c.req.raw);
	if (!token) throw new ApiError(401, 'Не авторизован.');

	const body = await parseJsonBody<{ code?: string }>(c.req.raw);
	if (!body.code) throw new ApiError(400, 'Код обязателен.');

	const res = await fetch(`${VK_BOT_URL}/confirm-link`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ code: body.code, token })
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({}));
		throw new ApiError(400, (data as { error?: string }).error || 'Неверный или просроченный код.');
	}

	(await res.json()) as { success: boolean; vkId: number };
	return json({ success: true, message: 'Аккаунт привязан.' });
});
