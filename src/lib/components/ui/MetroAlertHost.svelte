<script lang="ts">
	import {
		AlertTriangle,
		CheckCircle2,
		Info,
		ShieldAlert,
		type IconProps
	} from 'lucide-svelte';
	import type { ComponentType, SvelteComponent } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		dismissMetroAlert,
		metroAlerts,
		type MetroAlert,
		type MetroAlertTone
	} from '$lib/metroAlert';

	const toneClass: Record<MetroAlertTone, string> = {
		error: 'ui-metro-alert-error',
		success: 'ui-metro-alert-success',
		warning: 'ui-metro-alert-warning',
		info: 'ui-metro-alert-info'
	};

	const toneIcon: Record<MetroAlertTone, ComponentType<SvelteComponent<IconProps>>> = {
		error: ShieldAlert,
		success: CheckCircle2,
		warning: AlertTriangle,
		info: Info
	};

	let active = $derived($metroAlerts[0] as MetroAlert | undefined);
	let Icon = $derived(active ? toneIcon[active.tone] : Info);
</script>

{#if active}
	<div class="ui-metro-alert-screen" role="presentation">
		<div
			transition:fly={{ y: -28, duration: 220 }}
			class="ui-metro-alert-strip {toneClass[active.tone]}"
			role={active.mode === 'confirm' ? 'alertdialog' : 'alert'}
			aria-modal="true"
			aria-labelledby="metro-alert-title"
			aria-describedby="metro-alert-message"
		>
			<div class="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-5 sm:px-6">
				<div class="flex w-full items-start gap-4 text-left">
					<div
						class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-current/40"
					>
						<Icon class="h-5 w-5" />
					</div>

					<div class="min-w-0 flex-1">
						<h2
							id="metro-alert-title"
							class="text-xl leading-tight font-light text-[color:var(--ui-text)]"
						>
							{active.title}
						</h2>
						<p id="metro-alert-message" class="mt-1 text-sm leading-6 text-current">
							{active.message}
						</p>
					</div>
				</div>

				<div class="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
					{#if active.mode === 'confirm'}
						<button
							type="button"
							class="ui-button min-h-9 w-full px-4 py-2 text-sm sm:w-auto"
							onclick={() => dismissMetroAlert(active.id, false)}
						>
							{active.cancelLabel}
						</button>
					{/if}
					<button
						type="button"
						class="ui-button {active.mode === 'confirm' && active.tone === 'warning'
							? 'ui-button-danger'
							: 'ui-button-primary'} min-h-9 w-full px-4 py-2 text-sm sm:w-auto"
						onclick={() => dismissMetroAlert(active.id, true)}
					>
						{active.confirmLabel}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
