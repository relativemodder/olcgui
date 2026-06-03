<script lang="ts">
	import { Search, Info, BookOpen } from 'lucide-svelte';
	import { JITSI_SERVERS } from '$lib/wizard/constants';
	import { intro } from '$lib/motion/intro';

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

<div
	use:intro={{ rotation: 54, x: -14, z: -28, stagger: 32 }}
	class="ui-metro-surface mt-3 space-y-3 border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] p-3.5"
>
	<div class="flex items-center justify-between">
		<span
			class="flex items-center gap-1.5 text-xs font-medium tracking-wide text-[color:var(--ui-muted)] uppercase"
		>
			<BookOpen class="h-3.5 w-3.5 text-[color:var(--ui-muted)]" />
			<span>Слитые Jitsi-сервера ({JITSI_SERVERS.length})</span>
		</span>
		<button
			type="button"
			onclick={() => (showJitsiDirectory = !showJitsiDirectory)}
			class="ui-button cursor-pointer px-2 py-1 text-xs font-normal uppercase select-none"
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
					class="ui-input w-full py-1.5 pr-3 pl-7 text-[11px]"
				/>
				<Search class="absolute top-2 left-2.5 h-3.5 w-3.5 text-[color:var(--ui-muted)]" />
			</div>

			<div
				class="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto pr-1 text-[10px] sm:grid-cols-2"
			>
				{#each filteredJitsiServers as server (server)}
					<button
						type="button"
						onclick={() => onSelect(server)}
						class="ui-button cursor-pointer truncate px-2 py-1 text-left font-mono text-xs font-normal"
						title={server}
					>
						{server}
					</button>
				{/each}
			</div>
			<p class="flex items-start gap-1 text-[9px] leading-normal text-[color:var(--ui-muted)]">
				<Info class="mt-0.5 h-3 w-3 shrink-0 text-[color:var(--ui-muted)]" />
				<span
					>Кликните по домену, чтобы заменить его в вашей ссылке, сохранив название комнаты.</span
				>
			</p>
		</div>
	{/if}
</div>
