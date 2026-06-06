import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import type { Mode, Provider, Transport } from '../../shared/wizard/constants';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().$type<'admin' | 'user'>(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const instances = sqliteTable('instances', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
	name: text('name').notNull(),
	mode: text('mode').notNull().$type<Mode>(), // 'srv' = server, 'cnc' = client/cnc
	provider: text('provider').notNull().$type<Provider>(),
	roomUrl: text('room_url').notNull(),
	cryptoKey: text('crypto_key').notNull(), // hex-encoded encryption key
	transport: text('transport').notNull().$type<Transport>(),
	dns: text('dns').notNull().default('8.8.8.8:53'),
	socksHost: text('socks_host').notNull().default('127.0.0.1'),
	socksPort: integer('socks_port'), // port client/socks listens on
	socksUser: text('socks_user'),
	socksPass: text('socks_pass'),
	debug: integer('debug', { mode: 'boolean' }).notNull().default(false),
	autoRestart: integer('auto_restart', { mode: 'boolean' }).notNull().default(true),
	restartInterval: integer('restart_interval'), // minutes between periodic restarts (null = disabled)
	status: text('status')
		.notNull()
		.$type<'stopped' | 'running' | 'restarting' | 'error'>()
		.default('stopped'),
	branch: text('branch').notNull().default('master'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const logs = sqliteTable('logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	instanceId: integer('instance_id')
		.notNull()
		.references(() => instances.id, { onDelete: 'cascade' }),
	logLine: text('log_line').notNull(),
	timestamp: integer('timestamp', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	key: text('key').notNull().unique(),
	value: text('value').notNull()
});

export const sessions = sqliteTable('sessions', {
	token: text('token').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	username: text('username').notNull(),
	role: text('role').notNull().$type<'admin' | 'user'>(),
	expiresAt: integer('expires_at').notNull()
});
