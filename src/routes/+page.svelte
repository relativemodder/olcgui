<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { RefreshCw, Activity, Globe, Wifi, ShieldAlert, Sliders } from 'lucide-svelte';
	import TunnelCard from '$lib/components/TunnelCard.svelte';
	import Terminal from '$lib/components/Terminal.svelte';

	let { data } = $props();

	let polledStatuses = $state<Record<number, { status: string; autoRestart: boolean }>>({});
	let activeLogId = $state<number | null>(null);
	let activeLogs = $state<string[]>([]);
	let pollingInterval = $state<Timer | null>(null);
	let logPollingInterval = $state<Timer | null>(null);

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

	// Poll general statuses
	async function pollStatuses() {
		try {
			const res = await fetch(`/api/instances?_t=${Date.now()}`);
			if (res.ok) {
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
			}
		} catch (e) {
			console.error('Failed to poll statuses:', e);
		}
	}

	async function pollLogs(id: number) {
		try {
			const res = await fetch(`/api/instances?id=${id}&_t=${Date.now()}`);
			if (res.ok) {
				const resData = await res.json();
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
			}
		} catch (e) {
			console.error('Failed to poll logs:', e);
		}
	}

	function toggleLogDrawer(id: number) {
		if (activeLogId === id) {
			activeLogId = null;
			activeLogs = [];
			if (logPollingInterval) {
				clearInterval(logPollingInterval);
				logPollingInterval = null;
			}
		} else {
			activeLogId = id;
			activeLogs = [];
			pollLogs(id);
			if (logPollingInterval) clearInterval(logPollingInterval);
			logPollingInterval = setInterval(() => pollLogs(id), 1500);
		}
	}

	onMount(() => {
		pollStatuses();
		pollingInterval = setInterval(pollStatuses, 3000);
	});

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
		if (logPollingInterval) clearInterval(logPollingInterval);
	});
</script>

<svelte:head>
	<title>Панель управления | olcRTC Manager</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-white">Панель управления</h1>
			<p class="mt-1 text-sm text-zinc-400">
				Мониторинг, перезапуски и управление SOCKS5 WebRTC туннелями
			</p>
		</div>
		<a
			href="/wizard"
			class="flex cursor-pointer items-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200"
		>
			<Sliders class="h-4 w-4" />
			<span>Создать туннель</span>
		</a>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
		<div
			class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md"
		>
			<div>
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>Всего туннелей</span
				>
				<span class="mt-1 block text-2xl font-bold text-white">{totalCount}</span>
			</div>
			<div
				class="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-500"
			>
				<Globe class="h-5 w-5" />
			</div>
		</div>

		<div
			class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md"
		>
			<div>
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>Активно</span
				>
				<span class="mt-1 block text-2xl font-bold text-zinc-400">{runningCount}</span>
			</div>
			<div
				class="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400"
			>
				<Wifi class="h-5 w-5" />
			</div>
		</div>

		<div
			class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md"
		>
			<div>
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>Перезапуск</span
				>
				<span class="mt-1 block text-2xl font-bold text-zinc-400">{restartingCount}</span>
			</div>
			<div
				class="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400"
			>
				<RefreshCw class="h-5 w-5" />
			</div>
		</div>

		<div
			class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md"
		>
			<div>
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>Ошибки</span
				>
				<span class="mt-1 block text-2xl font-bold text-zinc-400">{errorCount}</span>
			</div>
			<div
				class="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-400"
			>
				<ShieldAlert class="h-5 w-5" />
			</div>
		</div>
	</div>

	{#if data.instances.length === 0}
		<div
			class="flex w-full flex-col items-center justify-center border border-zinc-800 bg-zinc-900 p-12 text-center shadow-lg"
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-950 text-red-500"
			>
				<Activity class="h-8 w-8" />
			</div>
			<h3 class="text-lg font-bold tracking-tight text-white">Нет настроенных туннелей</h3>
			<p class="mt-2 max-w-sm text-sm text-zinc-400">
				Вы еще не настроили ни одного инстанса. Воспользуйтесь мастером настройки, чтобы создать ваш
				первый туннель.
			</p>
			<a
				href="/wizard"
				class="mt-6 flex cursor-pointer items-center gap-2 bg-white px-6 py-2 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200"
			>
				<Sliders class="h-4 w-4" />
				<span>Запустить мастер</span>
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6">
			{#each data.instances as inst (inst.id)}
				<div
					class="flex flex-col overflow-hidden border border-zinc-800 bg-zinc-900 shadow-md"
				>
					<TunnelCard
						{inst}
						status={polledStatuses[inst.id]?.status ?? inst.status}
						autoRestart={polledStatuses[inst.id]?.autoRestart ?? inst.autoRestart}
						{activeLogId}
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
						<div class="flex flex-col border-t border-zinc-800 bg-zinc-950 p-5">
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
