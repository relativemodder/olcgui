import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { instances, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, canAccessInstance } from '$lib/server/auth/guards';

const VALID_MODES = ['srv', 'cnc'] as const;
const VALID_PROVIDERS = ['jitsi', 'wbstream', 'telemost'] as const;
const VALID_TRANSPORTS = ['datachannel', 'vp8channel', 'seichannel', 'videochannel'] as const;

export const load: PageServerLoad = async ({ url, locals }) => {
	const isAdmin = locals.user?.role === 'admin';

	const allUsers = isAdmin
		? await db
				.select({ id: users.id, username: users.username })
				.from(users)
				.orderBy(users.username)
		: [];

	const editIdStr = url.searchParams.get('edit');
	if (editIdStr) {
		const editId = Number(editIdStr);
		if (!isNaN(editId)) {
			const found = await db.select().from(instances).where(eq(instances.id, editId)).limit(1);
			if (found.length > 0) {
				const inst = found[0];
				if (locals.user && !canAccessInstance(locals.user, inst.userId)) {
					throw redirect(303, '/');
				}
				return {
					editInstance: inst,
					allUsers,
					isAdmin,
					currentUserId: locals.user?.userId
				};
			}
		}
	}
	return {
		editInstance: null,
		allUsers,
		isAdmin,
		currentUserId: locals.user?.userId
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		requireAuth(locals.user);

		const data = await request.formData();
		const idStr = data.get('id');
		const id = idStr ? Number(idStr) : null;

		const name = data.get('name')?.toString().trim();
		const mode = data.get('mode')?.toString();
		const provider = data.get('provider')?.toString();
		const roomUrl = data.get('roomUrl')?.toString().trim();
		const cryptoKey = data.get('cryptoKey')?.toString().trim();
		const transport = data.get('transport')?.toString();
		const dns = data.get('dns')?.toString().trim() || '8.8.8.8:53';
		const socksHost = data.get('socksHost')?.toString().trim() || '127.0.0.1';
		const socksPortStr = data.get('socksPort');
		const socksPort = socksPortStr ? Number(socksPortStr) : 8808;
		const socksUser = data.get('socksUser')?.toString().trim() || null;
		const socksPass = data.get('socksPass')?.toString().trim() || null;
		const debug = data.get('debug') === 'true';
		const restartIntervalStr = data.get('restartInterval');
		const restartIntervalVal = restartIntervalStr ? Number(restartIntervalStr) : null;
		const restartInterval = restartIntervalVal && restartIntervalVal > 0 ? restartIntervalVal : null;
		const ownerIdStr = data.get('userId');
		const ownerId = ownerIdStr ? Number(ownerIdStr) : null;

		if (!name || !mode || !provider || !roomUrl || !cryptoKey || !transport) {
			return fail(400, { error: 'Заполните все обязательные поля.' });
		}

		if (!(VALID_MODES as readonly string[]).includes(mode)) {
			return fail(400, { error: 'Некорректный режим работы.' });
		}
		if (!(VALID_PROVIDERS as readonly string[]).includes(provider)) {
			return fail(400, { error: 'Некорректный провайдер.' });
		}
		if (!(VALID_TRANSPORTS as readonly string[]).includes(transport)) {
			return fail(400, { error: 'Некорректный транспорт.' });
		}
		if (socksPortStr && (!Number.isFinite(socksPort) || socksPort < 1 || socksPort > 65535)) {
			return fail(400, { error: 'Порт SOCKS5 должен быть числом от 1 до 65535.' });
		}
		if (
			restartIntervalStr &&
			(restartIntervalVal === null || !Number.isFinite(restartIntervalVal) || restartIntervalVal < 0 || restartIntervalVal > 525600)
		) {
			return fail(400, { error: 'Интервал автоперезапуска должен быть от 0 до 525600 минут (1 год).' });
		}
		if (locals.user.role === 'admin' && ownerId) {
			const [owner] = await db
				.select({ id: users.id })
				.from(users)
				.where(eq(users.id, ownerId))
				.limit(1);
			if (!owner) {
				return fail(400, { error: 'Указанный пользователь-владелец не найден.' });
			}
		}

		try {
			if (id !== null && !isNaN(id)) {
				const [existing] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
				if (!existing) return fail(404, { error: 'Инстанс не найден.' });
				if (!canAccessInstance(locals.user, existing.userId)) {
					return fail(403, { error: 'Нет доступа к этому туннелю.' });
				}

				await db
					.update(instances)
					.set({
						name,
						mode: mode as 'srv' | 'cnc',
						provider: provider as 'jitsi' | 'wbstream' | 'telemost',
						roomUrl,
						cryptoKey,
						transport: transport as 'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel',
						dns,
						socksHost,
						socksPort: mode === 'cnc' ? socksPort : null,
						socksUser: mode === 'cnc' ? socksUser : null,
						socksPass: mode === 'cnc' ? socksPass : null,
						debug,
						restartInterval,
						...(locals.user.role === 'admin' && ownerId ? { userId: ownerId } : {})
					})
					.where(eq(instances.id, id));
			} else {
				await db.insert(instances).values({
					userId: locals.user.role === 'admin' && ownerId ? ownerId : locals.user.userId,
					name,
					mode: mode as 'srv' | 'cnc',
					provider: provider as 'jitsi' | 'wbstream' | 'telemost',
					roomUrl,
					cryptoKey,
					transport: transport as 'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel',
					dns,
					socksHost,
					socksPort: mode === 'cnc' ? socksPort : null,
					socksUser: mode === 'cnc' ? socksUser : null,
					socksPass: mode === 'cnc' ? socksPass : null,
					debug,
					restartInterval,
					status: 'stopped'
				});
			}
		} catch (error) {
			console.error('[WizardAction] Failed to insert/update tunnel:', error);
			return fail(500, { error: 'Ошибка сохранения конфигурации в базу данных.' });
		}

		throw redirect(303, '/');
	}
};
