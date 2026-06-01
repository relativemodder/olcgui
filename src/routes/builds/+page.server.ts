import type { PageServerLoad, Actions } from './$types';
import {
	getBranches,
	getCurrentBranchName,
	getCurrentCommit,
	checkoutBranch
} from '$lib/server/git/client';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	try {
		return {
			branches: await getBranches(),
			currentBranchName: await getCurrentBranchName(),
			currentCommit: await getCurrentCommit()
		};
	} catch (error) {
		console.error('[BuildsLoad] Error loading git info:', error);
		return {
			branches: [],
			currentBranchName: 'master',
			currentCommit: null
		};
	}
};

export const actions: Actions = {
	checkout: async ({ url }) => {
		const name = url.searchParams.get('name');
		if (!name) {
			return fail(400, { error: 'Не указано имя ветки для переключения.' });
		}

		try {
			const res = await checkoutBranch(name);
			if (!res.success) {
				return fail(400, { error: res.error });
			}
			return { success: true };
		} catch (error) {
			return fail(500, {
				error: error instanceof Error ? error.message : 'Не удалось переключить ветку.'
			});
		}
	}
};
