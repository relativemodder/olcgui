<script lang="ts">
	import type { ComponentType, Snippet, SvelteComponent } from 'svelte';
	import type { IconProps } from 'lucide-svelte';
	import { intro } from '$lib/motion/intro';

	let {
		label,
		value,
		icon: Icon,
		progress = -1,
		progressColor = undefined as string | undefined,
		motionDelay = 'auto' as number | 'auto',
		interactive = false,
		class: className = '',
		children = undefined as Snippet | undefined
	}: {
		label: string;
		value: string;
		icon: ComponentType<SvelteComponent<IconProps>>;
		progress?: number;
		progressColor?: string;
		motionDelay?: number | 'auto';
		interactive?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();

	let progressBarClass = $derived(
		progressColor ||
			(progress >= 90 ? 'bg-[color:var(--ui-danger)]' : 'bg-[color:var(--ui-accent)]')
	);
</script>

<div
	use:intro={{ delay: motionDelay }}
	class="ui-card ui-metro-surface flex items-center justify-between p-5 {className}"
	data-ui-interactive={interactive ? '' : undefined}
>
	<div class="flex w-full flex-col">
		<div class="flex items-center justify-between">
			<span class="block text-sm font-medium tracking-wide text-[color:var(--ui-muted)] uppercase"
				>{label}</span
			>
			<Icon class="h-4 w-4 text-[color:var(--ui-muted)]"></Icon>
		</div>
		<div class="mt-2 flex items-baseline gap-2">
			{#if children}
				{@render children()}
			{:else}
				<span class="block text-4xl font-thin">{value}</span>
			{/if}
		</div>
		{#if progress >= 0}
			<div class="mt-3 h-1.5 w-full overflow-hidden bg-[color:var(--ui-surface-2)]">
				<div
					class="h-full {progressBarClass} transition-all duration-500"
					style="width: {Math.min(100, progress)}%"
				></div>
			</div>
		{/if}
	</div>
</div>
