<script lang="ts">
	let {
		variant = 'default' as 'default' | 'green' | 'red' | 'amber' | 'emerald' | 'slate',
		class: className = '',
		children
	}: {
		variant?: 'default' | 'green' | 'red' | 'amber' | 'emerald' | 'slate';
		class?: string;
		children: import('svelte').Snippet;
	} = $props();

	const variants = {
		default: 'ui-badge',
		green: 'ui-badge ui-badge-success',
		red: 'ui-badge ui-badge-danger',
		amber: 'ui-badge ui-badge-warn',
		emerald: 'ui-badge ui-badge-success',
		slate: 'ui-badge'
	};
</script>

<span class="{variants[variant]} {className}">
	{@render children()}
</span>
