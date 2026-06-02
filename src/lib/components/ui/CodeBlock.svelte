<script lang="ts">
	import CopyButton from './CopyButton.svelte';

	let {
		code,
		language = 'text',
		class: className = '',
		showCopy = true
	}: {
		code: string;
		language?: string;
		class?: string;
		showCopy?: boolean;
	} = $props();
</script>

<div class="flex flex-col {className}">
	{#if showCopy}
		<div class="mb-3 flex items-center justify-between">
			{#if language === 'yaml'}
				<h3 class="ui-title flex items-center gap-2 text-xl font-light">YAML конфиг</h3>
			{/if}
			<div class="flex-1"></div>
			<CopyButton text={code} />
		</div>
	{/if}
	<pre
		class="ui-code overflow-x-auto p-4 font-mono text-[10px] leading-relaxed whitespace-pre-wrap select-all sm:text-[11px]">{code}</pre>
</div>
