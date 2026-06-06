import { json, type RequestHandler } from '@sveltejs/kit';
import type { Config } from '@sveltejs/kit';
import { startBinaryUpload, getUploadStatus } from '$lib/server/process/manager';
import { requireAdmin, normalizeError } from '$lib/server/auth/guards';

export const config: Config = {
	maxRequestBodySize: 1024 * 1024 * 100
};

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals.user);

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return json({ error: 'Файл не был загружен.' }, { status: 400 });
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const { uploadId } = startBinaryUpload(buffer, file.name);

		return json({ uploadId });
	} catch (error) {
		console.error('[UploadBuild] Error:', error);
		return json(
			{ error: normalizeError(error, 'Не удалось загрузить бинарный файл.') },
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ url, locals }) => {
	requireAdmin(locals.user);

	const uploadId = url.searchParams.get('uploadId');
	if (!uploadId) {
		return json({ error: 'uploadId parameter required.' }, { status: 400 });
	}

	const state = getUploadStatus(uploadId);
	if (!state) {
		return json({ error: 'Upload not found.' }, { status: 404 });
	}

	return json(state);
};
