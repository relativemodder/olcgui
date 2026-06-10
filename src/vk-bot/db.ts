import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DB_PATH } from './config';

let _db: Database | null = null;

function cleanupLinkRequests(db: Database): void {
	db.run('DELETE FROM link_requests WHERE used = 1 OR expires_at <= ?', [Date.now()]);
}

export function getDb(): Database {
	if (_db) return _db;

	mkdirSync(dirname(DB_PATH), { recursive: true });

	_db = new Database(DB_PATH, { create: true });
	_db.run(`
		CREATE TABLE IF NOT EXISTS users (
			vk_id INTEGER PRIMARY KEY,
			api_token TEXT NOT NULL,
			created_at TEXT DEFAULT (datetime('now'))
		)
	`);
	_db.run(`
		CREATE TABLE IF NOT EXISTS link_requests (
			code TEXT PRIMARY KEY,
			vk_id INTEGER NOT NULL,
			username TEXT NOT NULL,
			expires_at INTEGER NOT NULL,
			used INTEGER DEFAULT 0
		)
	`);

	return _db;
}

export function saveToken(vkId: number, token: string): void {
	const db = getDb();
	db.run(
		"INSERT OR REPLACE INTO users (vk_id, api_token, created_at) VALUES (?, ?, datetime('now'))",
		[vkId, token]
	);
}

export function deleteToken(vkId: number): void {
	const db = getDb();
	db.run('DELETE FROM users WHERE vk_id = ?', [vkId]);
}

export function createLinkRequest(vkId: number, username: string, code: string): void {
	const db = getDb();
	cleanupLinkRequests(db);
	const expiresAt = Date.now() + 5 * 60 * 1000;
	db.run(
		'INSERT OR REPLACE INTO link_requests (code, vk_id, username, expires_at, used) VALUES (?, ?, ?, ?, 0)',
		[code, vkId, username, expiresAt]
	);
}

export function consumeLinkRequest(code: string): { vkId: number; username: string } | null {
	const db = getDb();
	cleanupLinkRequests(db);
	const row = db
		.query<
			{ vk_id: number; username: string; expires_at: number; used: number },
			string
		>('SELECT vk_id, username, expires_at, used FROM link_requests WHERE code = ?')
		.get(code);

	if (!row) return null;
	if (row.used) return null;
	if (Date.now() > row.expires_at) return null;

	db.run('UPDATE link_requests SET used = 1 WHERE code = ?', [code]);
	return { vkId: row.vk_id, username: row.username };
}
