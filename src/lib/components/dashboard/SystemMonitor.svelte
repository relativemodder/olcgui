<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Cpu, HardDrive, ArrowDownUp, Activity } from 'lucide-svelte';
	import { canPollNow, createSerialPoller } from '$lib/client/serialPoller';
	import StatCard from '$lib/components/ui/StatCard.svelte';
	import { tileVisibility } from '$lib/stores/tileVisibility';

	interface SystemStats {
		cpuPercent: number;
		iowaitPercent: number;
		memoryTotal: number;
		memoryUsed: number;
		networkRxSec: number;
		networkTxSec: number;
	}

	let stats = $state<SystemStats>({
		cpuPercent: 0,
		iowaitPercent: 0,
		memoryTotal: 0,
		memoryUsed: 0,
		networkRxSec: 0,
		networkTxSec: 0
	});

	const statsPoller = createSerialPoller({
		intervalMs: 2000,
		failureIntervalMs: 6000,
		shouldRun: canPollNow,
		async run(signal) {
			const res = await fetch('/api/system/stats', { signal });
			if (res.ok) {
				stats = await res.json();
			} else {
				throw new Error(`System stats request failed with ${res.status}`);
			}
		},
		onError(error) {
			console.error('Failed to fetch system stats:', error);
		}
	});

	function triggerVisiblePoll() {
		if (canPollNow()) {
			statsPoller.trigger();
		}
	}

	onMount(() => {
		statsPoller.start();
		document.addEventListener('visibilitychange', triggerVisiblePoll);
		window.addEventListener('online', triggerVisiblePoll);
	});

	onDestroy(() => {
		statsPoller.stop();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', triggerVisiblePoll);
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', triggerVisiblePoll);
		}
	});

	function formatBytes(bytes: number, decimals = 2) {
		if (!+bytes) return '0 B';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	let memPercent = $derived(
		stats.memoryTotal > 0 ? (stats.memoryUsed / stats.memoryTotal) * 100 : 0
	);
</script>

<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
	{#if $tileVisibility.cpuStat}
		<StatCard
			label="Нагрузка ЦПУ, %"
			value={`${stats.cpuPercent}%`}
			icon={Cpu}
			progress={stats.cpuPercent}
			progressColor={stats.cpuPercent >= 90 ? 'bg-[color:var(--ui-danger)]' : undefined}
		/>
	{/if}

	{#if $tileVisibility.ramStat}
		<StatCard
			label="ОЗУ, ГБ"
			value={formatBytes(stats.memoryUsed, 1)}
			icon={HardDrive}
			progress={memPercent}
			progressColor={memPercent >= 90 ? 'bg-[color:var(--ui-danger)]' : undefined}
		>
			<span class="block text-4xl font-thin">{formatBytes(stats.memoryUsed, 1)}</span>
			<span class="text-xs text-[color:var(--ui-muted)]">/ {formatBytes(stats.memoryTotal, 1)}</span
			>
		</StatCard>
	{/if}

	{#if $tileVisibility.iowaitStat}
		<StatCard
			label="Нагрузка IOWait, %"
			value={`${stats.iowaitPercent}%`}
			icon={Activity}
			progress={stats.iowaitPercent}
			progressColor={stats.iowaitPercent >= 90 ? 'bg-[color:var(--ui-danger)]' : undefined}
		/>
	{/if}

	{#if $tileVisibility.networkStat}
		<StatCard label="Сеть" value="" icon={ArrowDownUp}>
			<div class="mt-2 flex flex-col gap-1">
				<div class="flex justify-between text-sm">
					<span class="text-[color:var(--ui-muted)]">Rx</span>
					<span class="font-normal">{formatBytes(stats.networkRxSec)}/s</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-[color:var(--ui-muted)]">Tx</span>
					<span class="font-normal">{formatBytes(stats.networkTxSec)}/s</span>
				</div>
			</div>
		</StatCard>
	{/if}
</div>
