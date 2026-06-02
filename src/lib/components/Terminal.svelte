<script lang="ts">
	import { Terminal as TerminalIcon, Loader2, CheckCircle2, XCircle } from 'lucide-svelte';

	let {
		logs = [],
		title = 'Журнал',
		statusText = '',
		statusType = 'idle',
		emptyText = 'Журнал пуст.',
		heightClass = 'h-80'
	} = $props();

	let container = $state<HTMLDivElement | null>(null);

	function scrollToBottom() {
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}

	$effect(() => {
		if (logs.length > 0) {
			setTimeout(scrollToBottom, 30);
		}
	});
</script>

<div class="flex flex-col">
	<div class="mb-3 flex items-center justify-between text-xs text-[color:var(--ui-muted)]">
		<span class="flex items-center gap-2">
			<TerminalIcon class="h-4 w-4 text-[color:var(--ui-muted)]" />
			<span>{title}</span>
		</span>
		{#if statusType === 'running'}
			<span
				class="flex animate-pulse items-center gap-1.5 text-xs font-normal text-[color:var(--ui-muted)]"
			>
				<Loader2 class="h-3.5 w-3.5 animate-spin" />
				<span>{statusText || 'Активно'}</span>
			</span>
		{:else if statusType === 'success'}
			<span class="flex items-center gap-1.5 text-xs font-normal text-[color:var(--ui-accent)]">
				<CheckCircle2 class="h-3.5 w-3.5" />
				<span>{statusText || 'Успешно'}</span>
			</span>
		{:else if statusType === 'error'}
			<span class="flex items-center gap-1.5 text-xs font-normal text-[color:var(--ui-danger)]">
				<XCircle class="h-3.5 w-3.5" />
				<span>{statusText || 'Ошибка'}</span>
			</span>
		{:else}
			<span class="text-xs font-normal text-[color:var(--ui-muted)]">{statusText || 'Готов'}</span
			>
		{/if}
	</div>

	<div
		bind:this={container}
		class="ui-code p-4 {heightClass} overflow-y-auto font-mono text-[10px] leading-relaxed select-text sm:text-[11px]"
	>
		{#if logs.length === 0}
			<span class="block py-10 text-center text-[color:var(--ui-muted)] italic">{emptyText}</span>
		{:else}
			{#each logs as logLine, i (i)}
				<div class="border-b border-[color:var(--ui-border-subtle)] py-0.5 last:border-b-0">
					{logLine}
				</div>
			{/each}
		{/if}
	</div>
</div>
