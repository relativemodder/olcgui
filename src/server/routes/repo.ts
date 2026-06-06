import { Hono } from 'hono';
import { checkoutBranch, getBranches, getCurrentBranchName, getCurrentCommit } from '../git/client';
import { ensureOlcrtcRepoSync, getRepoSyncing } from '../git/repo';
import { json, parseJsonBody, requireAdmin, requireString, ApiError } from '../core';
import type { AppBindings } from '../app';

export const repoRouter = new Hono<AppBindings>();

repoRouter.get('/', (c) => {
	requireAdmin(c.get('user'));
	return json({ repoSyncing: getRepoSyncing() });
});

repoRouter.get('/info', async (c) => {
	requireAdmin(c.get('user'));
	try {
		return json({
			branches: await getBranches(),
			currentBranchName: await getCurrentBranchName(),
			currentCommit: await getCurrentCommit()
		});
	} catch (error) {
		console.error('[API] Failed to read repo info:', error);
		return json({ branches: [], currentBranchName: 'master', currentCommit: null });
	}
});

repoRouter.post('/pull', (c) => {
	requireAdmin(c.get('user'));
	ensureOlcrtcRepoSync();
	return json({ success: true });
});

repoRouter.post('/checkout', async (c) => {
	requireAdmin(c.get('user'));
	const body = await parseJsonBody<{ name?: string }>(c.req.raw);
	const name = requireString(body.name, 'Не указано имя ветки для переключения.');
	const result = await checkoutBranch(name);
	if (!result.success) throw new ApiError(400, result.error || 'Не удалось переключить ветку.');
	return json({ success: true });
});
