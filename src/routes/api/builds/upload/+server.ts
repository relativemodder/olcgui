import { json, type RequestHandler } from '@sveltejs/kit';
import type { Config } from '@sveltejs/kit';
import { saveUploadedBinary } from '$lib/server/process/manager';
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

		await saveUploadedBinary(buffer);

		return json({ success: true, message: 'Бинарный файл успешно загружен и сохранен.' });
	} catch (error) {
		console.error('[UploadBuild] Error:', error);
		return json(
			{ error: normalizeError(error, 'Не удалось загрузить бинарный файл.') },
			{ status: 500 }
		);
	}
};
