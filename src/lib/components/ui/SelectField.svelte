<script lang="ts">
	let {
		id,
		label,
		value = $bindable(''),
		required = false,
		disabled = false,
		class: className = '',
		children
	}: {
		id: string;
		label: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<div class={className}>
	<label for={id} class="ui-label">
		{label}{#if required}
			*{/if}
	</label>
	<select
		{id}
		name={id}
		bind:value
		{disabled}
		class="ui-select cursor-pointer px-4 py-2.5 text-base font-normal focus:outline-none"
	>
		{@render children()}
	</select>
</div>
