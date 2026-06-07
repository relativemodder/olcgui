<script lang="ts">
	import { UploadCloud, AlertTriangle, Loader2, Check, XCircle } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { api, authHeaders } from '$lib/api';
	import { createSerialPoller } from '$lib/client/serialPoller';
	import type { UploadStartResponse } from '$shared/api/types';

	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let status = $state<'idle' | 'uploading' | 'validating' | 'success' | 'error'>('idle');
	let message = $state('');
	let uploadId: string | null = null;
	let xhr: XMLHttpRequest | null = null;

	const uploadPoller = createSerialPoller({
		intervalMs: 1000,
		timeoutMs: 60000,
		async run() {
			if (!uploadId) return false;

			const data = await api.builds.uploadStatus(uploadId);
			if (data.status === 'success') {
				status = 'success';
				message = data.message || 'Бинарный файл успешно загружен.';
				uploadId = null;
				return false;
			}
			if (data.status === 'error') {
				status = 'error';
				message = data.message || 'Ошибка проверки бинарного файла.';
				uploadId = null;
				return false;
			}
		},
		onError() {
			// retry on network error
		}
	});

	onDestroy(() => {
		xhr?.abort();
		uploadPoller.stop();
	});

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const formData = new FormData();
		formData.append('file', file);

		status = 'uploading';
		uploadProgress = 0;
		message = '';
		isUploading = true;
		uploadId = null;

		const req = new XMLHttpRequest();
		xhr = req;

		req.upload.onprogress = (e) => {
			if (e.lengthComputable) {
				uploadProgress = Math.round((e.loaded / e.total) * 100);
			}
		};

		req.onload = () => {
			isUploading = false;
			xhr = null;

			if (req.status >= 200 && req.status < 300) {
				try {
					const data = JSON.parse(req.responseText) as UploadStartResponse;
					uploadId = data.uploadId;
					status = 'validating';
					uploadPoller.trigger();
				} catch {
					status = 'error';
					message = 'Не удалось обработать ответ сервера.';
				}
			} else {
				status = 'error';
				try {
					const data = JSON.parse(req.responseText);
					message = data.error || 'Ошибка загрузки.';
				} catch {
					message = 'Ошибка загрузки.';
				}
			}

			input.value = '';
		};

		req.onerror = () => {
			isUploading = false;
			xhr = null;
			status = 'error';
			message = 'Сетевая ошибка при загрузке. Проверьте соединение.';
			input.value = '';
		};

		req.onabort = () => {
			isUploading = false;
			xhr = null;
		};

		req.open('POST', '/api/builds/upload');
		const authorization = authHeaders().get('authorization');
		if (authorization) req.setRequestHeader('Authorization', authorization);
		req.send(formData);
	}
</script>

<Panel title="Загрузка готовой сборки" icon={UploadCloud}>
	<div
		class="mb-6 flex items-start gap-3 border border-[color:var(--ui-warning-border)] bg-[color:var(--ui-warning-bg)] p-4 text-sm text-[color:var(--ui-warning-text)]"
	>
		<AlertTriangle class="h-5 w-5 shrink-0 text-[color:var(--ui-warning)]" />
		<p class="leading-relaxed">
			<strong class="font-medium">Внимание:</strong> Для серверов без поддержки локальной компиляции.
			Загружайте только бинарные файлы, собранные для вашей целевой архитектуры.
		</p>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-4 max-sm:flex-col">
			<label
				class="ui-button ui-button-primary flex cursor-pointer items-center justify-center gap-2 px-6 py-2.5 text-xs font-normal max-sm:w-full"
				class:opacity-50={isUploading}
				class:cursor-not-allowed={isUploading}
			>
				{#if status === 'uploading'}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Загрузка… {uploadProgress}%</span>
				{:else if status === 'validating'}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Проверка бинарного файла…</span>
				{:else}
					<UploadCloud class="h-4 w-4" />
					<span>Выбрать и загрузить бинарник</span>
				{/if}
				<input
					type="file"
					class="hidden"
					onchange={handleFileUpload}
					disabled={isUploading || status === 'validating'}
				/>
			</label>
		</div>

		{#if status === 'uploading'}
			<div class="flex items-center gap-3">
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--ui-surface-2)]">
					<div
						class="h-full rounded-full bg-[color:var(--ui-accent)] transition-all duration-300"
						style="width: {uploadProgress}%"
					></div>
				</div>
				<span class="shrink-0 text-xs text-[color:var(--ui-muted)] tabular-nums"
					>{uploadProgress}%</span
				>
			</div>
		{:else if status === 'validating'}
			<div class="flex items-center gap-2 text-sm text-[color:var(--ui-muted)]">
				<Loader2 class="h-4 w-4 animate-spin" />
				<span>Проверка исполняемого файла…</span>
			</div>
		{:else if status === 'success'}
			<div class="flex items-center gap-2 text-base text-[color:var(--ui-accent)]">
				<Check class="h-5 w-5 shrink-0" />
				<span>{message || 'Бинарный файл успешно загружен.'}</span>
			</div>
		{:else if status === 'error'}
			<div class="flex items-center gap-2 text-base text-[color:var(--ui-danger)]">
				<XCircle class="h-5 w-5 shrink-0" />
				<span>{message || 'Ошибка загрузки.'}</span>
			</div>
		{/if}
	</div>
</Panel>
