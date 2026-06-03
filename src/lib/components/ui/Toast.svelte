<script lang="ts">
	import { fly } from 'svelte/transition';
	import toasts, { type Toast } from '$lib/stores/toast';

	let visible = $state<Toast[]>([]);

	toasts.subscribe((t) => {
		visible = t;
	});
</script>

{#if visible.length > 0}
	<div class="fixed bottom-16 left-4 right-4 z-[100] flex flex-col gap-2 md:bottom-4 md:left-4 md:right-auto md:w-80">
		{#each visible as toast (toast.id)}
			<div
				transition:fly={{ y: 16, duration: 200 }}
				class="rounded border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface)] px-4 py-3 text-sm text-[color:var(--ui-text)] shadow-lg"
			>
				{toast.message}
			</div>
		{/each}
	</div>
{/if}
