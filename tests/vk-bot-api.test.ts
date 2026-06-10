import { describe, expect, it, mock } from 'bun:test';

describe('VK bot confirm link API', () => {
	it('normalizes confirm payloads strictly', async () => {
		const { normalizeConfirmBody } = await import('../src/vk-bot/api');

		expect(normalizeConfirmBody({ code: ' 123456 ', token: ' secret ' })).toEqual({
			code: '123456',
			token: 'secret'
		});
		expect(normalizeConfirmBody({ code: 'abc', token: 'secret' })).toBeNull();
		expect(normalizeConfirmBody({ code: '123456', token: '   ' })).toBeNull();
	});

	it('returns 400 for invalid confirm payloads', async () => {
		mock.module('../src/vk-bot/vk', () => ({
			vk: { api: { messages: { send: async () => undefined } } }
		}));
		mock.module('../src/vk-bot/db', () => ({
			consumeLinkRequest: () => null,
			saveToken: () => undefined
		}));

		const { botApi } = await import('../src/vk-bot/api');
		const response = await botApi.request(
			new Request('http://localhost/confirm-link', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ code: '12', token: 'secret' })
			})
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid code or token' });
	});
});

describe('VK bot delete flow helpers', () => {
	it('parses delete confirmation payload explicitly', async () => {
		const { parseDeleteConfirmation } = await import('../src/vk-bot/flows/delete-instance');

		expect(parseDeleteConfirmation({ confirm: true })).toBe(true);
		expect(parseDeleteConfirmation({ confirm: false })).toBe(false);
		expect(parseDeleteConfirmation({ confirm: 'yes' })).toBeNull();
		expect(parseDeleteConfirmation(null)).toBeNull();
	});
});
