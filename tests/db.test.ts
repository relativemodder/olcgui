import { describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import * as schema from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Schema & Integration Tests', () => {
	it('should run migrations and execute CRUD operations successfully', async () => {
		const sqlite = new Database(':memory:');
		const db = drizzle(sqlite, { schema });

		await migrate(db, { migrationsFolder: 'drizzle' });

		const [newUser] = await db
			.insert(schema.users)
			.values({
				username: 'admin_test',
				passwordHash: 'secure_password_hash',
				role: 'admin'
			})
			.returning();

		expect(newUser).toBeDefined();
		expect(newUser.id).toBe(1);
		expect(newUser.username).toBe('admin_test');
		expect(newUser.role).toBe('admin');
		expect(newUser.createdAt).toBeInstanceOf(Date);

		let errorThrown = false;
		try {
			await db.insert(schema.users).values({
				username: 'admin_test',
				passwordHash: 'another_hash',
				role: 'user'
			});
		} catch {
			errorThrown = true;
		}
		expect(errorThrown).toBe(true);

		const [newInstance] = await db
			.insert(schema.instances)
			.values({
				name: 'Jitsi Server Demo',
				mode: 'srv',
				provider: 'jitsi',
				roomUrl: 'https://meet.cryptopro.ru/demotunnel',
				cryptoKey: 'd823fa01cb3e0609b67322f7cf984c4ee2e4ce2e294936fc24ef38c9e59f4799',
				transport: 'datachannel'
			})
			.returning();

		expect(newInstance).toBeDefined();
		expect(newInstance.id).toBe(1);
		expect(newInstance.name).toBe('Jitsi Server Demo');
		expect(newInstance.mode).toBe('srv');
		expect(newInstance.debug).toBe(false);
		expect(newInstance.autoRestart).toBe(true);
		expect(newInstance.status).toBe('stopped');

		const [newLog] = await db
			.insert(schema.logs)
			.values({
				instanceId: newInstance.id,
				logLine: '2026/06/01 00:00:00 Connecting link...'
			})
			.returning();

		expect(newLog).toBeDefined();
		expect(newLog.instanceId).toBe(newInstance.id);
		expect(newLog.logLine).toBe('2026/06/01 00:00:00 Connecting link...');

		await db.insert(schema.settings).values({
			key: 'setup_completed',
			value: 'true'
		});

		const [savedSetting] = await db
			.select()
			.from(schema.settings)
			.where(eq(schema.settings.key, 'setup_completed'));

		expect(savedSetting).toBeDefined();
		expect(savedSetting.value).toBe('true');
	});
});
