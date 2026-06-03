import { json, type RequestHandler } from '@sveltejs/kit';
import { getBuildStatus, startBuild } from '$lib/server/git/build';
import { requireAdmin, normalizeError } from '$lib/server/auth/guards';

export const GET: RequestHandler = async ({ locals }) => {
	requireAdmin(locals.user);
	return json(getBuildStatus());
};

export const POST: RequestHandler = async ({ locals }) => {
	requireAdmin(locals.user);

	try {
		await startBuild();
		return json({ success: true });
	} catch (error) {
		return json({ error: normalizeError(error, 'Failed to start compilation.') }, { status: 500 });
	}
};
