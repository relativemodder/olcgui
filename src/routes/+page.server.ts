import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { instances } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { restartInstance, startInstance, stopInstance } from '$lib/server/process/manager';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const dbInstances = await db.select().from(instances);
	return {
		instances: dbInstances
	};
};

export const actions: Actions = {
	start: async ({ url }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			await startInstance(id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error)?.message || 'Не удалось запустить процесс.' });
		}
	},

	stop: async ({ url }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			await stopInstance(id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error)?.message || 'Не удалось остановить процесс.' });
		}
	},

	restart: async ({ url }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			await restartInstance(id);
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error)?.message || 'Не удалось перезапустить процесс.' });
		}
	},

	delete: async ({ url }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор инстанса.' });

		try {
			await stopInstance(id);
			await db.delete(instances).where(eq(instances.id, id));
			return { success: true };
		} catch (error) {
			return fail(500, { error: (error as Error)?.message || 'Не удалось удалить инстанс.' });
		}
	},

	toggleAutoRestart: async ({ url }) => {
		const id = Number(url.searchParams.get('id'));
		if (!id) return fail(400, { error: 'Неверный идентификатор.' });

		try {
			const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
			if (inst) {
				await db
					.update(instances)
					.set({ autoRestart: !inst.autoRestart })
					.where(eq(instances.id, id));
			}
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: (error as Error)?.message || 'Не удалось изменить политику перезапуска.'
			});
		}
	}
};
