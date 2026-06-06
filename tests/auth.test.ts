import { describe, expect, it } from 'bun:test';
import { hashPassword, verifyPassword } from '../src/server/auth/password';
import { createSession, getSession, destroySession } from '../src/server/auth/session';
import { db } from '../src/server/db/client';
import { users } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';

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

	it('should correctly handle the session creation, retrieval, and destruction lifecycle', async () => {
		const username = `cyber_admin_${crypto.randomUUID()}`;
		const role = 'admin';
		const [user] = await db
			.insert(users)
			.values({ username, passwordHash: 'test_hash', role })
			.returning();

		const sessionToken = await createSession(user.id, username, role);
		expect(sessionToken).toBeDefined();
		expect(sessionToken).toHaveLength(64);

		const session = await getSession(sessionToken);
		expect(session).not.toBeNull();
		expect(session?.userId).toBe(user.id);
		expect(session?.username).toBe(username);
		expect(session?.role).toBe(role);
		expect(session?.expiresAt).toBeGreaterThan(Date.now());

		await destroySession(sessionToken);

		const goneSession = await getSession(sessionToken);
		expect(goneSession).toBeNull();

		await db.delete(users).where(eq(users.id, user.id));
	});

	it('should gracefully handle empty or invalid session queries', async () => {
		expect(await getSession(null)).toBeNull();
		expect(await getSession(undefined)).toBeNull();
		expect(await getSession('non_existent_token')).toBeNull();
	});
});
