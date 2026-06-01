import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

const sqlite = new Database(env.DATABASE_URL || 'sqlite.db');

sqlite.exec('PRAGMA journal_mode = WAL;');

export const db = drizzle(sqlite, { schema });
export { sqlite };
