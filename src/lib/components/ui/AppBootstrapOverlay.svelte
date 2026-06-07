<script lang="ts">
	import DotProgress from './DotProgress.svelte';

	let { visible = false }: { visible?: boolean } = $props();
</script>

{#if visible}
	<div
		class="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-black text-white"
		style="--ui-text: #fff;"
		aria-hidden="true"
	>
		<div class="flex flex-col items-center gap-4">
			<DotProgress active />
			<div class="text-sm font-light tracking-[0.28em] text-white/80 uppercase">Загрузка</div>
		</div>
	</div>
{/if}
