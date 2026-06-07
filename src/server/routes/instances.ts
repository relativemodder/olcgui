import { Hono } from 'hono';
import { db } from '../db/client';
import { instances, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
	ApiError,
	json,
	parseJsonBody,
	requireAccessibleInstance,
	requireAuth,
	requireString
} from '../core';
import type { AppBindings } from '../app';
import {
	getInstanceLogs,
	getInstanceStatus,
	restartInstance,
	startInstance,
	stopInstance
} from '../process/manager';
import {
	isValidMode,
	isValidProvider,
	isValidTransport,
	type Mode,
	type Provider,
	type Transport
} from '../../shared/wizard/constants';

export const instancesRouter = new Hono<AppBindings>();

type InstanceBody = {
	name: string;
	mode: Mode;
	provider: Provider;
	roomUrl: string;
	cryptoKey: string;
	transport: Transport;
	socksPort: number;
	restartInterval: number | null;
	ownerId: number | null;
	dns: string;
	socksHost: string;
	socksUser: string | null;
	socksPass: string | null;
	debug: boolean;
};

async function parseInstanceBody(
	body: Record<string, unknown>,
	user: { role: string }
): Promise<InstanceBody> {
	const name = requireString(body.name, 'Заполните все обязательные поля.');
	const mode = typeof body.mode === 'string' ? body.mode : undefined;
	const provider = typeof body.provider === 'string' ? body.provider : undefined;
	const roomUrl = requireString(body.roomUrl, 'Заполните все обязательные поля.');
	const cryptoKey = requireString(body.cryptoKey, 'Заполните все обязательные поля.');
	const transport = typeof body.transport === 'string' ? body.transport : undefined;

	if (!isValidMode(mode)) throw new ApiError(400, 'Некорректный режим работы.');
	if (!isValidProvider(provider)) throw new ApiError(400, 'Некорректный провайдер.');
	if (!isValidTransport(transport)) throw new ApiError(400, 'Некорректный транспорт.');

	const socksPort = body.socksPort ? Number(body.socksPort) : 8808;
	if (!Number.isFinite(socksPort) || socksPort < 1 || socksPort > 65535) {
		throw new ApiError(400, 'Порт SOCKS5 должен быть числом от 1 до 65535.');
	}

	const restartIntervalValue = body.restartInterval ? Number(body.restartInterval) : null;
	const restartInterval =
		restartIntervalValue && restartIntervalValue > 0 ? restartIntervalValue : null;
	if (
		restartIntervalValue !== null &&
		(!Number.isFinite(restartIntervalValue) ||
			restartIntervalValue < 0 ||
			restartIntervalValue > 525600)
	) {
		throw new ApiError(400, 'Интервал автоперезапуска должен быть от 0 до 525600 минут (1 год).');
	}

	const ownerId = body.userId ? Number(body.userId) : null;
	if (user.role === 'admin' && ownerId) {
		const [owner] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, ownerId))
			.limit(1);
		if (!owner) throw new ApiError(400, 'Указанный пользователь-владелец не найден.');
	}

	return {
		name,
		mode,
		provider,
		roomUrl,
		cryptoKey,
		transport,
		socksPort,
		restartInterval,
		ownerId,
		dns: typeof body.dns === 'string' && body.dns.trim() ? body.dns.trim() : '8.8.8.8:53',
		socksHost:
			typeof body.socksHost === 'string' && body.socksHost.trim()
				? body.socksHost.trim()
				: '127.0.0.1',
		socksUser:
			mode === 'cnc' && typeof body.socksUser === 'string' && body.socksUser.trim()
				? body.socksUser.trim()
				: null,
		socksPass:
			mode === 'cnc' && typeof body.socksPass === 'string' && body.socksPass.trim()
				? body.socksPass.trim()
				: null,
		debug: body.debug === true
	};
}

instancesRouter.get('/', async (c) => {
	const user = requireAuth(c.get('user'));
	const idParam = c.req.query('id');

	if (idParam) {
		const id = Number(idParam);
		await requireAccessibleInstance(user, id);
		return json({ status: getInstanceStatus(id), logs: getInstanceLogs(id) });
	}

	const allInstances =
		user.role === 'admin'
			? await db.select().from(instances)
			: await db.select().from(instances).where(eq(instances.userId, user.userId));

	return json({
		instances: allInstances.map((inst) => ({
			...inst,
			status: getInstanceStatus(inst.id)
		}))
	});
});

instancesRouter.post('/', async (c) => {
	const user = requireAuth(c.get('user'));
	const body = await parseJsonBody<Record<string, unknown>>(c.req.raw);
	const parsed = await parseInstanceBody(body, user);

	const [created] = await db
		.insert(instances)
		.values({
			userId: user.role === 'admin' && parsed.ownerId ? parsed.ownerId : user.userId,
			name: parsed.name,
			mode: parsed.mode,
			provider: parsed.provider,
			roomUrl: parsed.roomUrl,
			cryptoKey: parsed.cryptoKey,
			transport: parsed.transport,
			dns: parsed.dns,
			socksHost: parsed.socksHost,
			socksPort: parsed.mode === 'cnc' ? parsed.socksPort : null,
			socksUser: parsed.socksUser,
			socksPass: parsed.socksPass,
			debug: parsed.debug,
			restartInterval: parsed.restartInterval,
			status: 'stopped'
		})
		.returning();

	return json({ instance: created }, 201);
});

instancesRouter.get('/:id', async (c) => {
	const user = requireAuth(c.get('user'));
	const id = Number(c.req.param('id'));
	const currentInstance = await requireAccessibleInstance(user, id);
	return json({ instance: currentInstance });
});

instancesRouter.patch('/:id', async (c) => {
	const user = requireAuth(c.get('user'));
	const id = Number(c.req.param('id'));
	await requireAccessibleInstance(user, id);
	const body = await parseJsonBody<Record<string, unknown>>(c.req.raw);
	const parsed = await parseInstanceBody(body, user);

	await db
		.update(instances)
		.set({
			name: parsed.name,
			mode: parsed.mode,
			provider: parsed.provider,
			roomUrl: parsed.roomUrl,
			cryptoKey: parsed.cryptoKey,
			transport: parsed.transport,
			dns: parsed.dns,
			socksHost: parsed.socksHost,
			socksPort: parsed.mode === 'cnc' ? parsed.socksPort : null,
			socksUser: parsed.socksUser,
			socksPass: parsed.socksPass,
			debug: parsed.debug,
			restartInterval: parsed.restartInterval,
			...(user.role === 'admin' && parsed.ownerId ? { userId: parsed.ownerId } : {})
		})
		.where(eq(instances.id, id));

	return json({ success: true });
});

instancesRouter.post('/:id/start', async (c) => {
	const user = requireAuth(c.get('user'));
	await requireAccessibleInstance(user, Number(c.req.param('id')));
	await startInstance(Number(c.req.param('id')));
	return json({ success: true });
});

instancesRouter.post('/:id/stop', async (c) => {
	const user = requireAuth(c.get('user'));
	await requireAccessibleInstance(user, Number(c.req.param('id')));
	await stopInstance(Number(c.req.param('id')));
	return json({ success: true });
});

instancesRouter.post('/:id/restart', async (c) => {
	const user = requireAuth(c.get('user'));
	await requireAccessibleInstance(user, Number(c.req.param('id')));
	await restartInstance(Number(c.req.param('id')));
	return json({ success: true });
});

instancesRouter.patch('/:id/auto-restart', async (c) => {
	const user = requireAuth(c.get('user'));
	const id = Number(c.req.param('id'));
	await requireAccessibleInstance(user, id);
	const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
	if (!inst) throw new ApiError(404, 'Инстанс не найден.');
	await db.update(instances).set({ autoRestart: !inst.autoRestart }).where(eq(instances.id, id));
	return json({ success: true, autoRestart: !inst.autoRestart });
});

instancesRouter.delete('/:id', async (c) => {
	const user = requireAuth(c.get('user'));
	const id = Number(c.req.param('id'));
	await requireAccessibleInstance(user, id);
	await stopInstance(id);
	await db.delete(instances).where(eq(instances.id, id));
	return json({ success: true });
});
