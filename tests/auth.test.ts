import { describe, expect, it } from 'bun:test';
import { hashPassword, verifyPassword } from '../src/lib/server/auth/password';
import { createSession, getSession, destroySession } from '../src/lib/server/auth/session';

describe('Authentication & Session Unit Tests', () => {
	it('should hash and verify passwords using Bun.password bcrypt', async () => {
		const plainPassword = 'cyberpunk_super_password_2026';
		const hash = await hashPassword(plainPassword);

		expect(hash).toBeDefined();
		expect(hash.length).toBeGreaterThan(30);

		const matches = await verifyPassword(plainPassword, hash);
		expect(matches).toBe(true);

		const mismatches = await verifyPassword('cyberpunk_super_password_2027', hash);
		expect(mismatches).toBe(false);
	});

	it('should correctly handle the session creation, retrieval, and destruction lifecycle', () => {
		const userId = 99;
		const username = 'cyber_admin';
		const role = 'admin';

		const sessionToken = createSession(userId, username, role);
		expect(sessionToken).toBeDefined();
		expect(sessionToken).toHaveLength(64);

		const session = getSession(sessionToken);
		expect(session).not.toBeNull();
		expect(session?.userId).toBe(userId);
		expect(session?.username).toBe(username);
		expect(session?.role).toBe(role);
		expect(session?.expiresAt).toBeGreaterThan(Date.now());

		destroySession(sessionToken);

		const goneSession = getSession(sessionToken);
		expect(goneSession).toBeNull();
	});

	it('should gracefully handle empty or invalid session queries', () => {
		expect(getSession(null)).toBeNull();
		expect(getSession(undefined)).toBeNull();
		expect(getSession('non_existent_token')).toBeNull();
	});
});
