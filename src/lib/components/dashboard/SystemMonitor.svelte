<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Cpu, HardDrive, ArrowDownUp, Activity } from 'lucide-svelte';

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

	let pollingInterval = $state<ReturnType<typeof setInterval> | null>(null);

	async function fetchStats() {
		try {
			const res = await fetch('/api/system/stats');
			if (res.ok) {
				stats = await res.json();
			}
		} catch (e) {
			console.error('Failed to fetch system stats:', e);
		}
	}

	onMount(() => {
		fetchStats();
		pollingInterval = setInterval(fetchStats, 2000);
	});

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
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

<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-4">
	<!-- CPU Card -->
	<div class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md">
		<div class="flex w-full flex-col">
			<div class="flex items-center justify-between">
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>Нагрузка ЦПУ, %</span
				>
				<Cpu class="h-4 w-4 text-zinc-500" />
			</div>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="block text-2xl font-bold text-white">{stats.cpuPercent}%</span>
			</div>
			<div class="mt-3 h-1.5 w-full overflow-hidden bg-zinc-800">
				<div
					class="h-full {stats.cpuPercent >= 90
						? 'bg-red-500'
						: 'bg-zinc-500'} transition-all duration-500"
					style="width: {stats.cpuPercent}%"
				></div>
			</div>
		</div>
	</div>

	<!-- RAM Card -->
	<div class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md">
		<div class="flex w-full flex-col">
			<div class="flex items-center justify-between">
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>ОЗУ, ГБ</span
				>
				<HardDrive class="h-4 w-4 text-zinc-500" />
			</div>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="block text-2xl font-bold text-white">{formatBytes(stats.memoryUsed, 1)}</span>
				<span class="text-xs text-zinc-500">/ {formatBytes(stats.memoryTotal, 1)}</span>
			</div>
			<div class="mt-3 h-1.5 w-full overflow-hidden bg-zinc-800">
				<div
					class="h-full {memPercent >= 90
						? 'bg-red-500'
						: 'bg-zinc-500'} transition-all duration-500"
					style="width: {memPercent}%"
				></div>
			</div>
		</div>
	</div>

	<!-- IOWait Card -->
	<div class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md">
		<div class="flex w-full flex-col">
			<div class="flex items-center justify-between">
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>Нагрузка IOWait, %</span
				>
				<Activity class="h-4 w-4 text-zinc-500" />
			</div>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="block text-2xl font-bold text-white">{stats.iowaitPercent}%</span>
			</div>
			<div class="mt-3 h-1.5 w-full overflow-hidden bg-zinc-800">
				<div
					class="h-full {stats.iowaitPercent >= 90
						? 'bg-red-500'
						: 'bg-zinc-500'} transition-all duration-500"
					style="width: {Math.min(100, stats.iowaitPercent)}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Network Card -->
	<div class="flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md">
		<div class="flex w-full flex-col">
			<div class="flex items-center justify-between">
				<span class="block text-xs font-semibold tracking-wider text-zinc-400 uppercase">Сеть</span>
				<ArrowDownUp class="h-4 w-4 text-zinc-500" />
			</div>
			<div class="mt-2 flex flex-col gap-1">
				<div class="flex justify-between text-sm">
					<span class="text-zinc-400">Rx</span>
					<span class="font-medium text-white">{formatBytes(stats.networkRxSec)}/s</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-zinc-400">Tx</span>
					<span class="font-medium text-white">{formatBytes(stats.networkTxSec)}/s</span>
				</div>
			</div>
		</div>
	</div>
</div>
