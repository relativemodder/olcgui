<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	let {
		type = 'button' as 'button' | 'submit' | 'reset',
		variant = 'primary' as 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon',
		size = 'default' as 'default' | 'sm' | 'icon',
		loading = false,
		disabled = false,
		title = '',
		class: className = '',
		onclick = undefined as (() => void) | undefined,
		children
	}: {
		type?: 'button' | 'submit' | 'reset';
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
		size?: 'default' | 'sm' | 'icon';
		loading?: boolean;
		disabled?: boolean;
		title?: string;
		class?: string;
		onclick?: () => void;
		children: import('svelte').Snippet;
	} = $props();

	const base = 'ui-button select-none disabled:cursor-not-allowed';

	const variants = {
		primary: 'ui-button-primary',
		secondary: '',
		danger: 'ui-button-danger',
		ghost: 'text-xs font-normal uppercase tracking-wide',
		icon: 'ui-button-icon'
	};

	const sizes = {
		default: 'min-h-9 px-4 py-2.5',
		sm: 'min-h-8 px-3 py-2 text-xs',
		icon: ''
	};
</script>

<button
	{type}
	{title}
	{disabled}
	{onclick}
	class="{base} {variants[variant]} {size !== 'icon' ? sizes[size] : ''} {variant === 'icon'
		? sizes.icon
		: ''} {className}"
>
	{#if loading}
		<Loader2 class="h-4 w-4 shrink-0 animate-spin" />
		<span>Загрузка...</span>
	{:else}
		{@render children()}
	{/if}
</button>
