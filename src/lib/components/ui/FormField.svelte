<script lang="ts">
	let {
		id,
		label,
		required = false,
		class: className = '',
		children
	}: {
		id: string;
		label: string;
		required?: boolean;
		class?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class={className}>
	<label for={id} class="ui-label">
		{label}{#if required}
			*{/if}
	</label>
	{@render children()}
</div>
