<script lang="ts">
	import { UploadCloud, AlertTriangle, Loader2 } from 'lucide-svelte';
	import Panel from '$lib/components/ui/Panel.svelte';

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
		<div class="flex items-center gap-4">
			<label
				class="ui-button ui-button-primary flex cursor-pointer items-center gap-2 px-6 py-2.5 text-xs font-normal"
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
			<p class="text-base font-normal text-[color:var(--ui-accent)]">{uploadMessage}</p>
		{:else if uploadSuccess === false}
			<p class="text-base font-normal text-[color:var(--ui-danger)]">{uploadMessage}</p>
		{/if}
	</div>
</Panel>
