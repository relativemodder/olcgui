import { json, type RequestHandler } from '@sveltejs/kit';
import { getBuildStatus, startBuild } from '$lib/server/git/build';

export const GET: RequestHandler = async () => {
	return json(getBuildStatus());
};

export const POST: RequestHandler = async () => {
	try {
		startBuild();
		return json({ success: true });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to start compilation.' },
			{ status: 500 }
		);
	}
};
