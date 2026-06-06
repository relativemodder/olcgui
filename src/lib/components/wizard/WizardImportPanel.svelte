<script lang="ts">
	import { parseOlcrtcUri, resolveImportUrl, type ParsedOlcrtcUri } from '$shared/wizard/utils';
	import { ArrowDownToLine, Check, AlertCircle } from 'lucide-svelte';
	import Panel from '$lib/components/ui/Panel.svelte';

	let { onImport } = $props<{
		onImport: (data: ParsedOlcrtcUri & { resolvedUrl: string }) => void;
	}>();

	let importUrlInput = $state('');
	let importError = $state('');
	let importSuccess = $state(false);

	function handleImportUrl() {
		importError = '';
		importSuccess = false;
		const val = importUrlInput.trim();
		if (!val) return;

		try {
			const parsed = parseOlcrtcUri(val);
			const resolvedUrl = resolveImportUrl(parsed);

			onImport({
				...parsed,
				resolvedUrl
			});

			importSuccess = true;
			importUrlInput = '';
			setTimeout(() => {
				importSuccess = false;
			}, 3000);
		} catch (e) {
			importError = e instanceof Error ? e.message : 'Не удалось распознать формат ссылки.';
		}
	}
</script>

<Panel title="Быстрый импорт туннеля" icon={ArrowDownToLine}>
	<p class="mb-4 text-[11px] leading-normal text-[color:var(--ui-muted)]">
		Вставьте ссылку конфигурации формата <code
			class="font-mono text-[color:var(--ui-accent)] select-all">olcrtc://...</code
		> для мгновенного импорта всех параметров.
	</p>

	<div class="flex gap-2">
		<input
			type="text"
			bind:value={importUrlInput}
			placeholder="olcrtc://telemost?vp8channel..."
			class="ui-input w-full px-3 py-2 font-mono text-xs"
		/>
		<button
			type="button"
			onclick={handleImportUrl}
			class="ui-button ui-button-primary shrink-0 cursor-pointer px-4 py-2 text-xs font-normal select-none"
		>
			Импорт
		</button>
	</div>

	{#if importError}
		<p class="mt-2.5 flex items-center gap-1 text-xs font-normal text-[color:var(--ui-danger)]">
			<AlertCircle class="h-3.5 w-3.5 shrink-0" />
			<span>{importError}</span>
		</p>
	{:else if importSuccess}
		<p class="mt-2.5 flex items-center gap-1 text-xs font-normal text-[color:var(--ui-accent)]">
			<Check class="h-3.5 w-3.5 shrink-0" />
			<span>Конфигурация успешно импортирована!</span>
		</p>
	{/if}
</Panel>
