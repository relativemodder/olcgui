<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';

	let {
		text,
		class: className = ''
	}: {
		text: string;
		class?: string;
	} = $props();

	let copied = $state(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			console.error('Failed to copy text to clipboard');
		}
	}
</script>

<button
	type="button"
	onclick={handleCopy}
	class="ui-button cursor-pointer px-3 py-1.5 text-xs font-normal select-none {className}"
>
	{#if copied}
		<Check class="h-3 w-3 text-[color:var(--ui-accent)]" />
		<span class="text-[color:var(--ui-accent)]">Скопировано</span>
	{:else}
		<Copy class="h-3 w-3" />
		<span>Скопировать</span>
	{/if}
</button>
