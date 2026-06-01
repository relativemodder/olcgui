<script lang="ts">
	import { Search, Info, BookOpen } from 'lucide-svelte';
	import { JITSI_SERVERS } from '$lib/wizard/constants';

	let { onSelect } = $props<{
		onSelect: (server: string) => void;
	}>();

	let showJitsiDirectory = $state(false);
	let jitsiSearchQuery = $state('');

	let filteredJitsiServers = $derived.by(() => {
		const q = jitsiSearchQuery.trim().toLowerCase();
		if (!q) return JITSI_SERVERS;
		return JITSI_SERVERS.filter((s) => s.toLowerCase().includes(q));
	});
</script>

<div class="mt-3 space-y-3 border border-zinc-800 bg-zinc-950 p-3.5">
	<div class="flex items-center justify-between">
		<span
			class="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
		>
			<BookOpen class="h-3.5 w-3.5 text-zinc-400" />
			<span>Слитые Jitsi-сервера ({JITSI_SERVERS.length})</span>
		</span>
		<button
			type="button"
			onclick={() => (showJitsiDirectory = !showJitsiDirectory)}
			class="cursor-pointer border border-zinc-800 bg-zinc-950 px-2 py-1 text-[9px] font-bold text-zinc-300 uppercase select-none hover:bg-zinc-850"
		>
			{showJitsiDirectory ? 'Скрыть список' : 'Показать список'}
		</button>
	</div>

	{#if showJitsiDirectory}
		<div class="space-y-2.5">
			<div class="relative">
				<input
					type="text"
					bind:value={jitsiSearchQuery}
					placeholder="Поиск хоста (например: arbitr, aston...)"
					class="w-full border border-zinc-800 bg-black py-1.5 pr-3 pl-7 text-[11px] text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none"
				/>
				<Search class="absolute top-2 left-2.5 h-3.5 w-3.5 text-zinc-500" />
			</div>

			<div
				class="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto pr-1 text-[10px] sm:grid-cols-2"
			>
				{#each filteredJitsiServers as server (server)}
					<button
						type="button"
						onclick={() => onSelect(server)}
						class="cursor-pointer truncate border border-zinc-800 bg-black px-2 py-1 text-left font-mono text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
						title={server}
					>
						{server}
					</button>
				{/each}
			</div>
			<p class="flex items-start gap-1 text-[9px] leading-normal text-zinc-500">
				<Info class="mt-0.5 h-3 w-3 shrink-0 text-zinc-400" />
				<span
					>Кликните по домену, чтобы заменить его в вашей ссылке, сохранив название комнаты.</span
				>
			</p>
		</div>
	{/if}
</div>
