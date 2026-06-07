import type { ApiRequest } from './client';
import type { BuildStatusResponse, UploadStatusResponse, UploadStartResponse } from './types';

export function createBuildsApi(request: ApiRequest) {
	return {
		status: () =>
			request<BuildStatusResponse>('GET', '/api/builds'),

		start: () =>
			request<void>('POST', '/api/builds'),

		uploadStatus: (uploadId: string) =>
			request<UploadStatusResponse>(
				'GET',
				`/api/builds/upload?uploadId=${encodeURIComponent(uploadId)}`,
			),

		upload: (file: File) => {
			const formData = new FormData();
			formData.append('file', file);
			return request<UploadStartResponse>('POST', '/api/builds/upload', {
				body: formData,
				isFormData: true,
			});
		},
	};
}
