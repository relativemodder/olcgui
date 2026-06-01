import { json, type RequestHandler } from '@sveltejs/kit';
import { ensureOlcrtcRepoSync } from '$lib/server/git/repo';

export const POST: RequestHandler = async () => {
	try {
		ensureOlcrtcRepoSync();
		return json({ success: true });
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to pull repository.'
			},
			{ status: 500 }
		);
	}
};
