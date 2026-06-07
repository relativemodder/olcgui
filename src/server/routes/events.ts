import { Hono } from 'hono';
import { streamSSE, type SSEStreamingApi } from 'hono/streaming';
import { db } from '../db/client';
import { instances } from '../db/schema';
import { eq } from 'drizzle-orm';
import { broker, type EventMessage } from '../events/broker';
import { BUILD_STATUS_TOPIC, REPO_STATUS_TOPIC } from '../events/topics';
import { requireAuth } from '../core';
import { getInstanceStatus } from '../process/manager';
import { getBuildStatus } from '../git/build';
import { getRepoSyncing } from '../git/repo';
import type { AppBindings } from '../app';
import type { Session } from '../auth/session';
import { matchTopic } from '../../shared/utils';

export const eventsRouter = new Hono<AppBindings>();

function parseFilters(raw: string | undefined): string[] {
	if (!raw) return ['*'];
	return raw
		.split(',')
		.map((f) => f.trim())
		.filter(Boolean);
}

async function sendInitialState(
	stream: SSEStreamingApi,
	user: Session,
	filters: string[],
	accessibleRows: { id: number; autoRestart: boolean }[]
) {
	for (const { id, autoRestart } of accessibleRows) {
		const topic = `instance:${id}:status`;
		if (!filters.some((f) => matchTopic(topic, f))) continue;

		await stream.writeSSE({
			event: 'message',
			data: JSON.stringify({
				topic,
				data: {
					id,
					status: getInstanceStatus(id),
					autoRestart
				}
			})
		});
	}

	if (user.role === 'admin') {
		if (filters.some((f) => matchTopic(BUILD_STATUS_TOPIC, f) || matchTopic('build:*', f))) {
			await stream.writeSSE({
				event: 'message',
				data: JSON.stringify({
					topic: BUILD_STATUS_TOPIC,
					data: getBuildStatus()
				})
			});
		}

		if (filters.some((f) => matchTopic(REPO_STATUS_TOPIC, f) || matchTopic('repo:*', f))) {
			await stream.writeSSE({
				event: 'message',
				data: JSON.stringify({
					topic: REPO_STATUS_TOPIC,
					data: { repoSyncing: getRepoSyncing() }
				})
			});
		}
	}
}

eventsRouter.get('/', async (c) => {
	const user = requireAuth(c.get('user'));
	const filters = parseFilters(c.req.query('topics'));
	const isAdmin = user.role === 'admin';

	const accessibleRows = isAdmin
		? await db.select({ id: instances.id, autoRestart: instances.autoRestart }).from(instances)
		: await db
				.select({ id: instances.id, autoRestart: instances.autoRestart })
				.from(instances)
				.where(eq(instances.userId, user.userId));
	const accessibleIds = new Set(accessibleRows.map((r) => r.id));

	return streamSSE(c, async (stream) => {
		let closed = false;
		let resolveWait: (() => void) | null = null;
		const pending: EventMessage[] = [];

		const handler = (msg: EventMessage) => {
			if (closed) return;
			if (!filters.some((f) => matchTopic(msg.topic, f))) return;

			const instanceMatch = msg.topic.match(/^instance:(\d+):/);
			if (instanceMatch) {
				if (!accessibleIds.has(Number(instanceMatch[1]))) return;
			} else if (msg.topic.startsWith('build:') || msg.topic.startsWith('repo:')) {
				if (!isAdmin) return;
			}

			pending.push(msg);
			resolveWait?.();
		};

		const unsub = broker.subscribe(handler);
		stream.onAbort(() => {
			closed = true;
			unsub();
			resolveWait?.();
		});

		try {
			await sendInitialState(stream, user, filters, accessibleRows);

			while (!closed) {
				while (pending.length > 0) {
					const msg = pending.shift()!;
					await stream.writeSSE({
						event: 'message',
						data: JSON.stringify({ topic: msg.topic, data: msg.data })
					});
				}

				if (closed) break;

				await new Promise<void>((resolve) => {
					resolveWait = resolve;
					setTimeout(() => {
						if (resolveWait === resolve) {
							resolveWait = null;
							resolve();
						}
					}, 30000);
				});
			}
		} catch {
			closed = true;
			unsub();
		}
	});
});
