<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Sliders, Globe, Wifi, ShieldAlert } from 'lucide-svelte';
	import { RefreshCw, Activity } from 'lucide-svelte';
	import { canPollNow, createSerialPoller } from '$lib/client/serialPoller';
	import TunnelCard from '$lib/components/TunnelCard.svelte';
	import Terminal from '$lib/components/Terminal.svelte';
	import SystemMonitor from '$lib/components/dashboard/SystemMonitor.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { metroIntro } from '$lib/motion/metro';

	let { data } = $props();

	let polledStatuses = $state<Record<number, { status: string; autoRestart: boolean }>>({});
	let activeLogId = $state<number | null>(null);
	let activeLogs = $state<string[]>([]);

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
			<a
				href="/wizard"
				class="ui-button ui-button-primary cursor-pointer px-4 py-2.5 text-sm font-normal"
			>
				<Sliders class="h-4 w-4" />
				<span>Создать туннель</span>
			</a>
		{/snippet}
	</PageHeader>

	<SystemMonitor />

	<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
		<StatCard label="Всего туннелей" value={String(totalCount)} icon={Globe} />
		<StatCard label="Активно" value={String(runningCount)} icon={Wifi} />
		<StatCard label="В процессе перезапуска" value={String(restartingCount)} icon={RefreshCw} />
		<StatCard label="Ошибки" value={String(errorCount)} icon={ShieldAlert} />
	</div>

	<hr class="mb-8 text-[color:var(--ui-border)]" />

	{#if data.instances.length === 0}
		<div
			use:metroIntro
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
				<div use:metroIntro class="ui-panel ui-metro-surface flex flex-col overflow-hidden">
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
