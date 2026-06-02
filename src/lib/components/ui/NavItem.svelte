<script lang="ts">
	import type { ComponentType, SvelteComponent } from 'svelte';
	import type { IconProps } from 'lucide-svelte';

	let {
		href,
		currentPath,
		icon: Icon,
		label,
		variant = 'desktop' as 'desktop' | 'mobile'
	}: {
		href: string;
		currentPath: string;
		icon: ComponentType<SvelteComponent<IconProps>>;
		label: string;
		variant?: 'desktop' | 'mobile';
	} = $props();

	let isActive = $derived(currentPath === href);
</script>

{#if variant === 'desktop'}
	<a {href} class="ui-nav-link {isActive ? 'ui-nav-link-active' : ''}">
		<Icon class="h-4 w-4"></Icon>
		<span>{label}</span>
	</a>
{:else}
	<a
		{href}
		class="group flex flex-col items-center gap-1 px-3 py-1 text-xs font-normal {isActive
			? 'text-[color:var(--ui-text)]'
			: 'text-[color:var(--ui-muted)]'}"
	>
		<Icon
			class="h-4 w-4 transition-transform duration-150 ease-out group-active:scale-[0.85] motion-reduce:transition-none"
		></Icon>
		<span>{label}</span>
	</a>
{/if}
