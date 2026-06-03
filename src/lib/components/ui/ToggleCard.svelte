<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';

	let {
		value,
		ontoggle = () => {},
		label,
		desc = '',
		chevron = false,
		chevronOpen = false,
		onchevronclick = () => {},
		small = false,
		indented = false,
		class: className = ''
	}: {
		value: boolean;
		ontoggle?: () => void;
		label: string;
		desc?: string;
		chevron?: boolean;
		chevronOpen?: boolean;
		onchevronclick?: () => void;
		small?: boolean;
		indented?: boolean;
		class?: string;
	} = $props();
</script>

<div
	class="ui-card ui-toggle-card ui-metro-surface flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm {small
		? 'py-2'
		: 'py-2.5'} {indented ? 'ml-9' : ''} {className}"
	data-ui-interactive
	role="button"
	tabindex="0"
	onclick={chevron ? onchevronclick : ontoggle}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			(chevron ? onchevronclick : ontoggle)();
		}
	}}
>
	<button
		type="button"
		class="shrink-0 cursor-pointer"
		data-ui-press-exclude
		onclick={(e) => {
			e.stopPropagation();
			ontoggle();
		}}
	>
		<div
			class="ui-switch-track {small ? 'ui-switch-small' : ''}"
			class:ui-switch-on={value}
		>
			<div class="ui-switch-thumb" class:ui-switch-on={value} />
		</div>
	</button>
	<div class="flex flex-1 flex-col">
		<span class="font-medium text-[color:var(--ui-text)]">{label}</span>
		{#if desc}
			<span class="text-xs">{desc}</span>
		{/if}
	</div>
	{#if chevron}
		<div
			class="shrink-0 text-[color:var(--ui-muted)] transition-transform duration-200"
			class:rotate-90={chevronOpen}
		>
			<ChevronRight class="h-5 w-5" />
		</div>
	{/if}
</div>
