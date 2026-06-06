import { Hono } from 'hono';
import { getBuildStatus, startBuild } from '../git/build';
import { getUploadStatus, startBinaryUpload } from '../process/manager';
import { json, requireAdmin, ApiError } from '../core';
import type { AppBindings } from '../app';

export const buildsRouter = new Hono<AppBindings>();

buildsRouter.get('/', (c) => {
	requireAdmin(c.get('user'));
	return json(getBuildStatus());
});

buildsRouter.post('/', (c) => {
	requireAdmin(c.get('user'));
	startBuild();
	return json({ success: true });
});

buildsRouter.get('/upload', (c) => {
	requireAdmin(c.get('user'));
	const uploadId = c.req.query('uploadId');
	if (!uploadId) throw new ApiError(400, 'uploadId parameter required.');
	const state = getUploadStatus(uploadId);
	if (!state) throw new ApiError(404, 'Upload not found.');
	return json(state);
});

buildsRouter.post('/upload', async (c) => {
	requireAdmin(c.get('user'));
	const formData = await c.req.raw.formData();
	const file = formData.get('file');
	if (!(file instanceof File)) throw new ApiError(400, 'Файл не был загружен.');

	const buffer = Buffer.from(await file.arrayBuffer());
	return json(startBinaryUpload(buffer, file.name));
});
