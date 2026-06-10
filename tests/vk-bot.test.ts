import { beforeEach, describe, expect, it } from 'bun:test';
import {
	checkUserCooldown,
	deduplicate,
	hasResponded,
	markResponded,
	resetRuntimeState,
	setSession,
	getSession
} from '../src/vk-bot/session';
import { isSupportedRoomUrl } from '../src/vk-bot/flows/create-instance';

describe('VK bot runtime state', () => {
	beforeEach(() => {
		resetRuntimeState();
	});

	it('tracks duplicate and responded message ids', () => {
		expect(deduplicate(101)).toBe(false);
		expect(deduplicate(101)).toBe(true);

		expect(hasResponded(202)).toBe(false);
		markResponded(202);
		expect(hasResponded(202)).toBe(true);
	});

	it('applies cooldown without affecting stored flow session', () => {
		setSession(777, 'create-instance', { step: 'roomUrl' });

		expect(checkUserCooldown(777, 1200)).toBe(false);
		expect(checkUserCooldown(777, 1200)).toBe(true);
		expect(getSession(777)?.flow).toBe('create-instance');
	});
});

describe('VK bot instance validation', () => {
	it('validates provider-specific room urls', () => {
		expect(isSupportedRoomUrl('jitsi', 'https://meet.cryptopro.ru/demo')).toBe(true);
		expect(isSupportedRoomUrl('wbstream', 'https://stream.wb.ru/room/demo-tunnel')).toBe(true);
		expect(isSupportedRoomUrl('telemost', 'https://telemost.yandex.ru/j/123456789')).toBe(true);

		expect(isSupportedRoomUrl('wbstream', 'https://meet.cryptopro.ru/demo')).toBe(false);
		expect(isSupportedRoomUrl('telemost', 'not a url')).toBe(false);
	});
});
