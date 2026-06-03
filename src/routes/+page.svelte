<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Sliders, Globe, Wifi, ShieldAlert, Settings } from 'lucide-svelte';
	import { RefreshCw, Activity } from 'lucide-svelte';
	import { canPollNow, createSerialPoller } from '$lib/client/serialPoller';
	import {
		CustomizationPopup,
		TunnelCard,
		Terminal,
		SystemMonitor,
		PageHeader,
		StatCard,
		intro,
		tileVisibility
	} from '$lib';

	let { data } = $props();

	let showCustomization = $state(false);

	let polledStatuses = $state<Record<number, { status: string; autoRestart: boolean }>>({});
	let activeLogId = $state<number | null>(null);
	let activeLogs = $state<string[]>([]);
	const instanceCardIgnoreSelector =
		'a, button, form, input, select, textarea, summary, [role="button"], [data-tunnel-card-ignore]';

	let totalCount = $derived(data.instances.length);
	let runningCount = $derived(
		data.instances.filter((i) => (polledStatuses[i.id]?.status ?? i.status) === 'running').length
	);
	let restartingCount = $derived(
		data.instances.filter((i) => (polledStatuses[i.id]?.status ?? i.status) === 'restarting').length
	);
	let errorCount = $derived(
		data.instances.filter((i) => (polledStatuses[i.id]?.status ?? i.status) === 'error').length
	);

	const statusPoller = createSerialPoller({
		intervalMs: 3000,
		failureIntervalMs: 8000,
		shouldRun: canPollNow,
		async run(signal) {
			if (data.instances.length === 0) return;

			const res = await fetch(`/api/instances?_t=${Date.now()}`, { signal });
			if (!res.ok) {
				throw new Error(`Instance status request failed with ${res.status}`);
			}

			const resData = await res.json();
			if (resData.instances) {
				let nextStatuses = { ...polledStatuses };
				let changed = false;
				for (const entry of resData.instances) {
					const current = nextStatuses[entry.id];
					if (
						!current ||
						current.status !== entry.status ||
						current.autoRestart !== entry.autoRestart
					) {
						nextStatuses[entry.id] = {
							status: entry.status,
							autoRestart: entry.autoRestart
						};
						changed = true;
					}
				}
				if (changed) {
					polledStatuses = nextStatuses;
				}
			}
		},
		onError(error) {
			console.error('Failed to poll statuses:', error);
		}
	});

	const logPoller = createSerialPoller({
		intervalMs: 1500,
		failureIntervalMs: 6000,
		shouldRun: () => activeLogId !== null && canPollNow(),
		async run(signal) {
			const id = activeLogId;
			if (id === null) {
				return;
			}

			const res = await fetch(`/api/instances?id=${id}&_t=${Date.now()}`, { signal });
			if (!res.ok) {
				throw new Error(`Instance logs request failed with ${res.status}`);
			}

			const resData = await res.json();
			if (activeLogId !== id) return;

			if (resData.logs) {
				activeLogs = resData.logs;
				if (resData.status) {
					const existing = polledStatuses[id];
					const inst = data.instances.find((i) => i.id === id);
					const autoRestart = existing ? existing.autoRestart : inst ? inst.autoRestart : false;
					if (
						!existing ||
						existing.status !== resData.status ||
						existing.autoRestart !== autoRestart
					) {
						polledStatuses = {
							...polledStatuses,
							[id]: {
								status: resData.status,
								autoRestart
							}
						};
					}
				}
			}
		},
		onError(error) {
			console.error('Failed to poll logs:', error);
		}
	});

	function triggerVisiblePoll() {
		if (canPollNow()) {
			statusPoller.trigger();
			if (activeLogId !== null) {
				logPoller.trigger();
			}
		}
	}

	function toggleLogDrawer(id: number) {
		if (activeLogId === id) {
			activeLogId = null;
			activeLogs = [];
			logPoller.stop();
		} else {
			activeLogId = id;
			activeLogs = [];
			logPoller.trigger();
		}
	}

	function openInstanceSettings(event: MouseEvent, id: number) {
		if (
			event.defaultPrevented ||
			(event.target instanceof Element && event.target.closest(instanceCardIgnoreSelector))
		) {
			return;
		}

		void goto(`/wizard?edit=${id}`);
	}

	function openInstanceSettingsFromKeyboard(event: KeyboardEvent, id: number) {
		if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
			return;
		}

		event.preventDefault();
		void goto(`/wizard?edit=${id}`);
	}

	onMount(() => {
		statusPoller.start();
		document.addEventListener('visibilitychange', triggerVisiblePoll);
		window.addEventListener('online', triggerVisiblePoll);
	});

	onDestroy(() => {
		statusPoller.stop();
		logPoller.stop();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', triggerVisiblePoll);
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', triggerVisiblePoll);
		}
	});
</script>

<svelte:head>
	<title>Панель управления | olcRTC Manager</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader
		title="Панель управления"
		description="Мониторинг, перезапуски и управление SOCKS5 WebRTC туннелями"
	>
		{#snippet actions()}
			<div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
				<a
					href="/wizard"
					class="ui-button ui-button-primary w-full cursor-pointer px-4 py-2.5 text-sm font-normal sm:w-auto"
				>
					<Sliders class="h-4 w-4" />
					<span>Создать туннель</span>
				</a>
				<button
					type="button"
					class="ui-button w-full cursor-pointer px-4 py-2.5 text-sm font-normal sm:w-auto"
					onclick={() => (showCustomization = true)}
				>
					<Settings class="h-4 w-4" />
					<span>Кастомизация</span>
				</button>
			</div>
		{/snippet}
	</PageHeader>

	{#if $tileVisibility.systemMonitor}
		<SystemMonitor />
	{/if}

	{#if $tileVisibility.statCards}
		<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
			{#if $tileVisibility.totalTunnelsStat}
				<StatCard label="Всего туннелей" value={String(totalCount)} icon={Globe} />
			{/if}
			{#if $tileVisibility.activeStat}
				<StatCard label="Активно" value={String(runningCount)} icon={Wifi} />
			{/if}
			{#if $tileVisibility.restartingStat}
				<StatCard label="В процессе перезапуска" value={String(restartingCount)} icon={RefreshCw} />
			{/if}
			{#if $tileVisibility.errorStat}
				<StatCard label="Ошибки" value={String(errorCount)} icon={ShieldAlert} />
			{/if}
		</div>
	{/if}

	<hr class="mb-8 text-[color:var(--ui-border)]" />

	{#if data.instances.length === 0}
		<div
			use:intro
			class="ui-panel ui-metro-surface ui-empty flex w-full flex-col items-center justify-center p-12 text-center"
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)] text-[color:var(--ui-danger)]"
			>
				<Activity class="h-8 w-8" />
			</div>
			<h3 class="text-2xl font-thin">Нет настроенных туннелей</h3>
			<p class="mt-2 max-w-sm text-sm text-[color:var(--ui-muted)]">
				Туннелей пока нет. Создайте первый через мастер настройки.
			</p>
			<a
				href="/wizard"
				class="ui-button ui-button-primary mt-6 cursor-pointer px-6 py-2 text-sm font-normal"
			>
				<Sliders class="h-4 w-4" />
				<span>Запустить мастер</span>
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6">
			{#each data.instances as inst (inst.id)}
				<div
					use:intro
					class="ui-panel ui-metro-surface ui-instance-card group flex cursor-pointer flex-col overflow-hidden"
					data-ui-interactive
					role="link"
					tabindex="0"
					aria-label="Открыть настройки туннеля {inst.name}"
					onclick={(event) => openInstanceSettings(event, inst.id)}
					onkeydown={(event) => openInstanceSettingsFromKeyboard(event, inst.id)}
				>
					<TunnelCard
						{inst}
						status={polledStatuses[inst.id]?.status ?? inst.status}
						autoRestart={polledStatuses[inst.id]?.autoRestart ?? inst.autoRestart}
						{toggleLogDrawer}
						updateOptimisticStatus={(id: number, newStatus: string) => {
							polledStatuses = {
								...polledStatuses,
								[id]: {
									...polledStatuses[id],
									status: newStatus,
									autoRestart: polledStatuses[id]?.autoRestart ?? inst.autoRestart
								}
							};
						}}
						updateOptimisticAutoRestart={(id: number, newAutoRestart: boolean) => {
							polledStatuses = {
								...polledStatuses,
								[id]: {
									...polledStatuses[id],
									status: polledStatuses[id]?.status ?? inst.status,
									autoRestart: newAutoRestart
								}
							};
						}}
					/>

					{#if activeLogId === inst.id}
						<div
							data-tunnel-card-ignore
							data-ui-press-exclude
							class="flex flex-col border-t border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] p-5"
						>
							<Terminal
								logs={activeLogs}
								title="Консоль инстанса"
								statusText={(polledStatuses[inst.id]?.status ?? inst.status) === 'running'
									? 'Polling'
									: (polledStatuses[inst.id]?.status ?? inst.status) === 'restarting'
										? 'Restarting'
										: 'Idle'}
								statusType={(polledStatuses[inst.id]?.status ?? inst.status) === 'running'
									? 'running'
									: (polledStatuses[inst.id]?.status ?? inst.status) === 'restarting'
										? 'running'
										: 'idle'}
								emptyText="Ожидание логов... запустите инстанс, если он остановлен"
								heightClass="h-64"
							/>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<CustomizationPopup open={showCustomization} onclose={() => (showCustomization = false)} />
