import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { instances } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const editIdStr = url.searchParams.get('edit');
	if (editIdStr) {
		const editId = Number(editIdStr);
		if (!isNaN(editId)) {
			const found = await db.select().from(instances).where(eq(instances.id, editId)).limit(1);
			if (found.length > 0) {
				return {
					editInstance: found[0]
				};
			}
		}
	}
	return {
		editInstance: null
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const idStr = data.get('id');
		const id = idStr ? Number(idStr) : null;

		const name = data.get('name')?.toString().trim();
		const mode = data.get('mode')?.toString() as 'srv' | 'cnc';
		const provider = data.get('provider')?.toString() as 'jitsi' | 'wbstream' | 'telemost';
		const roomUrl = data.get('roomUrl')?.toString().trim();
		const cryptoKey = data.get('cryptoKey')?.toString().trim();
		const transport = data.get('transport')?.toString() as
			| 'datachannel'
			| 'vp8channel'
			| 'seichannel'
			| 'videochannel';
		const dns = data.get('dns')?.toString().trim() || '8.8.8.8:53';
		const socksHost = data.get('socksHost')?.toString().trim() || '127.0.0.1';
		const socksPortStr = data.get('socksPort');
		const socksPort = socksPortStr ? Number(socksPortStr) : 8808;
		const socksUser = data.get('socksUser')?.toString().trim() || null;
		const socksPass = data.get('socksPass')?.toString().trim() || null;
		const debug = data.get('debug') === 'true';

		if (!name || !mode || !provider || !roomUrl || !cryptoKey || !transport) {
			return fail(400, { error: 'Заполните все обязательные поля.' });
		}

		try {
			if (id !== null && !isNaN(id)) {
				await db
					.update(instances)
					.set({
						name,
						mode,
						provider,
						roomUrl,
						cryptoKey,
						transport,
						dns,
						socksHost,
						socksPort: mode === 'cnc' ? socksPort : null,
						socksUser: mode === 'cnc' ? socksUser : null,
						socksPass: mode === 'cnc' ? socksPass : null,
						debug
					})
					.where(eq(instances.id, id));
			} else {
				await db.insert(instances).values({
					name,
					mode,
					provider,
					roomUrl,
					cryptoKey,
					transport,
					dns,
					socksHost,
					socksPort: mode === 'cnc' ? socksPort : null,
					socksUser: mode === 'cnc' ? socksUser : null,
					socksPass: mode === 'cnc' ? socksPass : null,
					debug,
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
