<script lang="ts">
	import type { ComponentType, Snippet, SvelteComponent } from 'svelte';
	import type { IconProps } from 'lucide-svelte';
	import { metroIntro } from '$lib/motion/metro';

	let {
		title = '',
		icon: Icon = undefined,
		actions = undefined as Snippet | undefined,
		motionDelay = 'auto' as number | 'auto',
		class: className = '',
		children
	}: {
		title?: string;
		icon?: ComponentType<SvelteComponent<IconProps>>;
		actions?: Snippet;
		motionDelay?: number | 'auto';
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div use:metroIntro={{ delay: motionDelay }} class="ui-panel ui-metro-surface {className}">
	{#if title || actions}
		<div class="ui-panel-header">
			{#if title}
				<h2 class="ui-panel-title">
					{#if Icon}
						<Icon class="h-4 w-4 text-[color:var(--ui-muted)]"></Icon>
					{/if}
					<span>{title}</span>
				</h2>
			{/if}
			{#if actions}
				{@render actions()}
			{/if}
		</div>
	{/if}
	<div class="ui-panel-body">
		{@render children()}
	</div>
</div>
