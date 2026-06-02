<script lang="ts">
	import { CheckCircle2, ShieldAlert, X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let {
		message = '',
		type = 'error' as 'error' | 'success',
		class: className = ''
	}: {
		message?: string;
		type?: 'error' | 'success';
		class?: string;
	} = $props();

	let visible = $state(false);
	let isError = $derived(type === 'error');
	let title = $derived(isError ? 'Ошибка' : 'Готово');

	$effect(() => {
		visible = Boolean(message);
	});
</script>

{#if message && visible}
	<div class="ui-metro-alert-screen {className}" role="presentation">
		<div
			transition:fly={{ y: -28, duration: 220 }}
			class="ui-metro-alert-strip {isError
				? 'ui-metro-alert-error'
				: 'ui-metro-alert-success'}"
			role="alert"
		>
			<div class="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-5 sm:px-6">
				<div class="flex w-full items-start gap-4 text-left">
					<div
						class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-current/40"
					>
						{#if isError}
							<ShieldAlert class="h-5 w-5" />
						{:else}
							<CheckCircle2 class="h-5 w-5" />
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<h2 class="text-xl leading-tight font-light text-[color:var(--ui-text)]">
							{title}
						</h2>
						<p class="mt-1 text-sm leading-6 text-current">{message}</p>
					</div>
				</div>

				<div class="flex w-full flex-col items-stretch sm:flex-row sm:justify-end">
					<button
						type="button"
						class="ui-button min-h-9 w-full px-4 py-2 text-sm sm:w-auto"
						title="Закрыть"
						onclick={() => (visible = false)}
					>
						<X class="h-4 w-4" />
						<span>Закрыть</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
