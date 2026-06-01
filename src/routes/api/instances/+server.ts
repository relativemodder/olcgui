import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { instances } from '$lib/server/db/schema';
import { getInstanceStatus, getInstanceLogs } from '$lib/server/process/manager';

export const GET: RequestHandler = async ({ url }) => {
	const idParam = url.searchParams.get('id');

	if (idParam) {
		const id = Number(idParam);
		return json({
			status: getInstanceStatus(id),
			logs: getInstanceLogs(id)
		});
	}

	try {
		const allInstances = await db.select().from(instances);
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
			{ error: error instanceof Error ? error.message : 'Database error' },
			{ status: 500 }
		);
	}
};
