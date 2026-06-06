<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { Sliders, Globe, Wifi, ShieldAlert, Settings } from 'lucide-svelte';
	import { RefreshCw, Activity } from 'lucide-svelte';
	import { apiFetch } from '$lib/api';
	import { connectEvents } from '$lib/client/events';
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

	let events = $state<ReturnType<typeof connectEvents> | null>(null);

	function getTopics(): string[] {
		if (activeLogId !== null) {
			return ['instance:*', `instance:${activeLogId}:log`];
		}
		return ['instance:*'];
	}

	function connectSse() {
		events?.close();

		events = connectEvents(getTopics());
		events.on('instance:*:status', (d) => {
			const data = d as { id: number; status: string; autoRestart: boolean };
			const existing = polledStatuses[data.id];
			if (
				!existing ||
				existing.status !== data.status ||
				existing.autoRestart !== data.autoRestart
			) {
				polledStatuses = {
					...polledStatuses,
					[data.id]: { status: data.status, autoRestart: data.autoRestart }
				};
			}
		});
		events.on(`instance:${activeLogId || 0}:log`, (d) => {
			const data = d as { instanceId: number; logLine: string };
			if (data.instanceId === activeLogId) {
				activeLogs = [...activeLogs, data.logLine];
			}
		});
	}

	async function toggleLogDrawer(id: number) {
		if (activeLogId === id) {
			activeLogId = null;
			activeLogs = [];
			connectSse();
		} else {
			activeLogId = id;
			activeLogs = [];
			try {
				const res = await apiFetch(`/api/instances?id=${id}`);
				if (res.ok) {
					const resData = await res.json();
					activeLogs = resData.logs || [];
					if (resData.status) {
						polledStatuses = {
							...polledStatuses,
							[id]: {
								status: resData.status,
								autoRestart: polledStatuses[id]?.autoRestart ?? false
							}
						};
					}
				}
			} catch (e) {
				console.error('Failed to fetch initial logs:', e);
			}
			connectSse();
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
		connectSse();
	});

	onDestroy(() => {
		events?.close();
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
