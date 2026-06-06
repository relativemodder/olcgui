import { describe, expect, it, beforeAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

let db: ReturnType<typeof drizzle>;
let createSession: (userId: number, username: string, role: 'admin' | 'user') => Promise<string>;
let getSession: (token: string | null | undefined) => Promise<{
	userId: number;
	username: string;
	role: 'admin' | 'user';
	expiresAt: number;
} | null>;
let destroySession: (token: string | null | undefined) => Promise<void>;
let hashPassword: (password: string) => Promise<string>;
let verifyPassword: (password: string, hash: string) => Promise<boolean>;

beforeAll(async () => {
	process.env.DATABASE_URL = ':memory:';

	const { db: clientDb } = await import('../src/server/db/client');
	const { hashPassword: hp, verifyPassword: vp } = await import('../src/server/auth/password');
	const {
		createSession: cs,
		getSession: gs,
		destroySession: ds
	} = await import('../src/server/auth/session');
	const { migrate: runMigrations } = await import('drizzle-orm/bun-sqlite/migrator');

	db = clientDb;
	hashPassword = hp;
	verifyPassword = vp;
	createSession = cs;
	getSession = gs;
	destroySession = ds;

	await runMigrations(db, { migrationsFolder: 'drizzle' });
});

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
		const schemaModule = await import('../src/server/db/schema');
		const { eq } = await import('drizzle-orm');

		const username = `cyber_admin_${crypto.randomUUID()}`;
		const role = 'admin';
		const [user] = await db
			.insert(schemaModule.users)
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

		await db.delete(schemaModule.users).where(eq(schemaModule.users.id, user.id));
	});

	it('should gracefully handle empty or invalid session queries', async () => {
		expect(await getSession(null)).toBeNull();
		expect(await getSession(undefined)).toBeNull();
		expect(await getSession('non_existent_token')).toBeNull();
	});
});
