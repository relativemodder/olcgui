<script lang="ts">
	import { UploadCloud, AlertTriangle, Loader2 } from 'lucide-svelte';

	let isUploading = $state(false);
	let uploadSuccess = $state<boolean | null>(null);
	let uploadMessage = $state<string>('');

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const file = input.files[0];
		const formData = new FormData();
		formData.append('file', file);

		isUploading = true;
		uploadSuccess = null;
		uploadMessage = '';

		try {
			const res = await fetch('/api/builds/upload', {
				method: 'POST',
				body: formData
			});
			const data = await res.json();
			if (res.ok) {
				uploadSuccess = true;
				uploadMessage = data.message || 'Файл загружен';
			} else {
				uploadSuccess = false;
				uploadMessage = data.error || 'Ошибка загрузки';
			}
		} catch (e) {
			console.error('Upload error:', e);
			uploadSuccess = false;
			uploadMessage = 'Произошла ошибка при загрузке';
		} finally {
			isUploading = false;
			input.value = '';
		}
	}
</script>

<div class="flex flex-col border border-zinc-800 bg-zinc-900 p-6 shadow-md">
	<div class="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<h2 class="flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
			<UploadCloud class="h-5 w-5 text-zinc-500" />
			<span>Загрузка готовой сборки</span>
		</h2>
	</div>

	<div
		class="mb-6 flex items-start gap-3 border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200"
	>
		<AlertTriangle class="h-5 w-5 shrink-0 text-yellow-500" />
		<p class="leading-relaxed">
			<strong class="font-bold">Внимание:</strong> Этот функционал предназначен исключительно для маломощных
			серверов, у которых не хватает вычислительных мощностей для локальной компиляции исходного кода.
			Загружайте только бинарные файлы, собранные для вашей целевой архитектуры.
		</p>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-4">
			<label
				class="flex cursor-pointer items-center gap-2 bg-white px-6 py-2.5 text-xs font-semibold text-black shadow-sm hover:bg-zinc-200"
				class:opacity-50={isUploading}
				class:cursor-not-allowed={isUploading}
			>
				{#if isUploading}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Загрузка...</span>
				{:else}
					<UploadCloud class="h-4 w-4" />
					<span>Выбрать и загрузить бинарник</span>
				{/if}
				<input type="file" class="hidden" onchange={handleFileUpload} disabled={isUploading} />
			</label>
		</div>

		{#if uploadSuccess === true}
			<p class="text-sm font-semibold text-emerald-400">{uploadMessage}</p>
		{:else if uploadSuccess === false}
			<p class="text-sm font-semibold text-red-400">{uploadMessage}</p>
		{/if}
	</div>
</div>
