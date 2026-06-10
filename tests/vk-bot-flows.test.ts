import { describe, expect, it } from 'bun:test';

describe('VK bot flow helpers', () => {
	it('parses generic boolean choices', async () => {
		const { parseBooleanChoice } = await import('../src/vk-bot/flows/shared');

		expect(parseBooleanChoice({ confirm: true }, 'confirm')).toBe(true);
		expect(parseBooleanChoice({ confirm: false }, 'confirm')).toBe(false);
		expect(parseBooleanChoice({ confirm: 'yes' }, 'confirm')).toBeNull();
		expect(parseBooleanChoice(undefined, 'confirm')).toBeNull();
	});

	it('detects cancel payload commands', async () => {
		const { isCancelCommand } = await import('../src/vk-bot/flows/shared');

		expect(isCancelCommand({ messagePayload: { command: '/cancel' } })).toBe(true);
		expect(isCancelCommand({ messagePayload: { command: '/help' } })).toBe(false);
		expect(isCancelCommand({ messagePayload: null })).toBe(false);
	});
});
