import type { PageServerLoad, Actions } from './$types';
import {
	getBranches,
	getCurrentBranchName,
	getCurrentCommit,
	checkoutBranch
} from '$lib/server/git/client';
import { fail } from '@sveltejs/kit';
import { requireAdmin, normalizeError } from '$lib/server/auth/guards';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		return {
			branches: await getBranches(),
			currentBranchName: await getCurrentBranchName(),
			currentCommit: await getCurrentCommit(),
			isAdmin: locals.user?.role === 'admin'
		};
	} catch (error) {
		console.error('[BuildsLoad] Error loading git info:', error);
		return {
			branches: [],
			currentBranchName: 'master',
			currentCommit: null,
			isAdmin: locals.user?.role === 'admin'
		};
	}
};

export const actions: Actions = {
	checkout: async ({ url, locals }) => {
		requireAdmin(locals.user);

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
				error: normalizeError(error, 'Не удалось переключить ветку.')
			});
		}
	}
};
