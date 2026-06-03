<script lang="ts">
	import type { Snippet } from 'svelte';
	import { intro } from '$lib/motion/intro';

	let {
		title,
		description = '',
		actions = undefined as Snippet | undefined
	}: {
		title: string;
		description?: string;
		actions?: Snippet;
	} = $props();
</script>

<div
	use:intro={{ duration: 460, rotation: 48, x: -16 }}
	class="mb-6 flex flex-col items-start justify-between gap-4 border-b border-[color:var(--ui-border)] pb-4 sm:flex-row sm:items-end"
>
	<div>
		<h1 class="text-4xl leading-tight font-thin sm:text-5xl">{title}</h1>
		{#if description}
			<p class="mt-2 text-base text-[color:var(--ui-muted)]">{description}</p>
		{/if}
	</div>
	{#if actions}
		{@render actions()}
	{/if}
</div>
