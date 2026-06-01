<script lang="ts">
	import { parseOlcrtcUri, resolveImportUrl, type ParsedOlcrtcUri } from '$lib/wizard/utils';
	import { ArrowDownToLine, Check, AlertCircle } from 'lucide-svelte';

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

<div class="border border-zinc-800 bg-zinc-900 p-6 shadow-md">
	<h2 class="mb-3 flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
		<ArrowDownToLine class="h-4.5 w-4.5 text-zinc-500" />
		<span>Быстрый импорт туннеля</span>
	</h2>

	<p class="mb-4 text-[11px] leading-normal text-zinc-400">
		Вставьте ссылку конфигурации формата <code class="font-mono text-zinc-300 select-all"
			>olcrtc://...</code
		> для мгновенного импорта всех параметров.
	</p>

	<div class="flex gap-2">
		<input
			type="text"
			bind:value={importUrlInput}
			placeholder="olcrtc://telemost?vp8channel..."
			class="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-white focus:border-zinc-500 focus:outline-none"
		/>
		<button
			type="button"
			onclick={handleImportUrl}
			class="shrink-0 cursor-pointer bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm select-none hover:bg-zinc-200"
		>
			Импорт
		</button>
	</div>

	{#if importError}
		<p class="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-red-400">
			<AlertCircle class="h-3.5 w-3.5 shrink-0" />
			<span>{importError}</span>
		</p>
	{:else if importSuccess}
		<p class="mt-2.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
			<Check class="h-3.5 w-3.5 shrink-0" />
			<span>Конфигурация успешно импортирована!</span>
		</p>
	{/if}
</div>
