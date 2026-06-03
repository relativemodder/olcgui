import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { instances } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { restartInstance, startInstance, stopInstance } from '$lib/server/process/manager';
import { fail } from '@sveltejs/kit';
import { requireAuth, canAccessInstance, normalizeError } from '$lib/server/auth/guards';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	const dbInstances =
		user?.role === 'admin'
			? await db.select().from(instances)
			: await db.select().from(instances).where(eq(instances.userId, user!.userId));

	return {
		instances: dbInstances,
		user
	};
};

export const actions: Actions = {
	start: async ({ url, locals }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
			if (!inst) return fail(404, { error: 'Инстанс не найден.' });
			requireAuth(locals.user);
			if (!canAccessInstance(locals.user, inst.userId)) return fail(403, { error: 'Нет доступа.' });

			await startInstance(id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: normalizeError(error, 'Не удалось запустить процесс.') });
		}
	},

	stop: async ({ url, locals }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
			if (!inst) return fail(404, { error: 'Инстанс не найден.' });
			requireAuth(locals.user);
			if (!canAccessInstance(locals.user, inst.userId)) return fail(403, { error: 'Нет доступа.' });

			await stopInstance(id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: normalizeError(error, 'Не удалось остановить процесс.') });
		}
	},

	restart: async ({ url, locals }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
			if (!inst) return fail(404, { error: 'Инстанс не найден.' });
			requireAuth(locals.user);
			if (!canAccessInstance(locals.user, inst.userId)) return fail(403, { error: 'Нет доступа.' });

			await restartInstance(id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: normalizeError(error, 'Не удалось перезапустить процесс.') });
		}
	},

	delete: async ({ url, locals }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
			if (!inst) return fail(404, { error: 'Инстанс не найден.' });
			requireAuth(locals.user);
			if (!canAccessInstance(locals.user, inst.userId)) return fail(403, { error: 'Нет доступа.' });

			await stopInstance(id);
			await db.delete(instances).where(eq(instances.id, id));
			return { success: true };
		} catch (error) {
			return fail(500, { error: normalizeError(error, 'Не удалось удалить инстанс.') });
		}
	},

	toggleAutoRestart: async ({ url, locals }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор.' });

		try {
			const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
			if (!inst) return fail(404, { error: 'Инстанс не найден.' });
			requireAuth(locals.user);
			if (!canAccessInstance(locals.user, inst.userId)) return fail(403, { error: 'Нет доступа.' });

			await db
				.update(instances)
				.set({ autoRestart: !inst.autoRestart })
				.where(eq(instances.id, id));
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: normalizeError(error, 'Не удалось изменить политику перезапуска.')
			});
		}
	}
};
