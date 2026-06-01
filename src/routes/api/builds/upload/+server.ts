import { json, type RequestHandler } from '@sveltejs/kit';
import { saveUploadedBinary } from '$lib/server/process/manager';

export const POST: RequestHandler = async ({ request }) => {
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
			{ error: error instanceof Error ? error.message : 'Не удалось загрузить бинарный файл.' },
			{ status: 500 }
		);
	}
};
