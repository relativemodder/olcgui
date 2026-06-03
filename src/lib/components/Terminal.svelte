<script lang="ts">
	import {
		Terminal as TerminalIcon,
		Loader2,
		CheckCircle2,
		XCircle,
		ChevronDown
	} from 'lucide-svelte';

	let {
		logs = [],
		title = 'Журнал',
		statusText = '',
		statusType = 'idle',
		emptyText = 'Журнал пуст.',
		heightClass = 'h-80'
	} = $props();

	let container = $state<HTMLDivElement | null>(null);
	let userScrolledUp = $state(false);

	function scrollToBottom() {
		if (container) {
			container.scrollTop = container.scrollHeight;
		}
	}

	function handleScroll() {
		if (container) {
			const threshold = 40;
			userScrolledUp =
				container.scrollTop < container.scrollHeight - container.clientHeight - threshold;
		}
	}

	function scrollToBottomAndResume() {
		scrollToBottom();
		userScrolledUp = false;
	}

	$effect(() => {
		if (logs.length > 0 && !userScrolledUp) {
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
			<span class="text-xs font-normal text-[color:var(--ui-muted)]">{statusText || 'Готов'}</span>
		{/if}
	</div>

	<div class="relative">
		<div
			bind:this={container}
			onscroll={handleScroll}
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

		{#if userScrolledUp}
			<button
				onclick={scrollToBottomAndResume}
				class="absolute right-3 bottom-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)] text-[color:var(--ui-text)] shadow-lg transition-all hover:bg-[color:var(--ui-surface-strong)]"
				aria-label="Прокрутить вниз"
			>
				<ChevronDown class="h-4 w-4" />
			</button>
		{/if}
	</div>
</div>
