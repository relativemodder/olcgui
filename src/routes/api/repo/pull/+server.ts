import { json, type RequestHandler } from '@sveltejs/kit';
import { ensureOlcrtcRepoSync } from '$lib/server/git/repo';
import { requireAdmin, normalizeError } from '$lib/server/auth/guards';

export const POST: RequestHandler = async ({ locals }) => {
	requireAdmin(locals.user);

	try {
		ensureOlcrtcRepoSync();
		return json({ success: true });
	} catch (error) {
		return json(
			{
				error: normalizeError(error, 'Failed to pull repository.')
			},
			{ status: 500 }
		);
	}
};
