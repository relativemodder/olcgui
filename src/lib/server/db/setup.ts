import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { db } from './client';
import path from 'path';

export async function setupDatabase() {
	console.log('[DB] Checking and running schema migrations...');
	try {
		await migrate(db, { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
		console.log('[DB] Schema migrations applied successfully.');
	} catch (error) {
		console.error('[DB] Failed to apply schema migrations:', error);
		throw error;
	}
}
