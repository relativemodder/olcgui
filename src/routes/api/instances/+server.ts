import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { instances } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getInstanceStatus, getInstanceLogs } from '$lib/server/process/manager';
import { requireAuth, canAccessInstance, normalizeError } from '$lib/server/auth/guards';

export const GET: RequestHandler = async ({ url, locals }) => {
	const user = locals.user;
	requireAuth(user);

	const idParam = url.searchParams.get('id');

	if (idParam) {
		const id = Number(idParam);
		const [inst] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
		if (!inst) return json({ error: 'Не найдено.' }, { status: 404 });
		if (!canAccessInstance(user, inst.userId)) {
			return json({ error: 'Нет доступа.' }, { status: 403 });
		}

		return json({
			status: getInstanceStatus(id),
			logs: getInstanceLogs(id)
		});
	}

	try {
		const allInstances = user.role === 'admin'
			? await db.select().from(instances)
			: await db.select().from(instances).where(eq(instances.userId, user.userId));

		const statusList = allInstances.map((inst) => ({
			id: inst.id,
			status: getInstanceStatus(inst.id),
			autoRestart: inst.autoRestart
		}));

		return json({
			instances: statusList
		});
	} catch (error) {
		return json(
			{ error: normalizeError(error, 'Database error') },
			{ status: 500 }
		);
	}
};
