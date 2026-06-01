<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import {
		Cpu,
		GitBranch,
		GitCommit,
		User,
		Calendar,
		RefreshCw,
		Loader2,
		ChevronRight
	} from 'lucide-svelte';
	import Terminal from '$lib/components/Terminal.svelte';

	let { data, form } = $props();

	let isBuilding = $state(false);
	let buildLogs = $state<string[]>([]);
	let buildSuccess = $state<boolean | null>(null);
	let buildInterval = $state<Timer | null>(null);

	let repoSyncing = $state<boolean>(false);
	let repoInterval = $state<Timer | null>(null);

	async function pollRepoSync() {
		try {
			const res = await fetch('/api/repo');
			if (res.ok) {
				const info = await res.json();
				repoSyncing = !!info.repoSyncing;
			}
		} catch (e) {
			console.error('Failed to poll repo sync status:', e);
		}
	}

	// Poll compile progress
	async function pollBuild() {
		try {
			const res = await fetch('/api/builds');
			if (res.ok) {
				const info = await res.json();
				isBuilding = info.isBuilding;
				buildLogs = info.logs;
				buildSuccess = info.success;

				if (!isBuilding && buildInterval) {
					clearInterval(buildInterval);
					buildInterval = null;
					window.location.reload();
				}
			}
		} catch (e) {
			console.error('Failed to poll compile status:', e);
		}
	}

	async function triggerBuild() {
		try {
			const res = await fetch('/api/builds', { method: 'POST' });
			if (res.ok) {
				isBuilding = true;
				buildLogs = ['[Build] Triggering compilation...'];
				buildSuccess = null;
				if (buildInterval) clearInterval(buildInterval);
				buildInterval = setInterval(pollBuild, 1000);
			}
		} catch (e) {
			console.error('Failed to start build:', e);
		}
	}

	onMount(() => {
		pollRepoSync();
		repoInterval = setInterval(pollRepoSync, 800);

		pollBuild();
		setTimeout(() => {
			if (isBuilding) {
				buildInterval = setInterval(pollBuild, 1000);
			}
		}, 100);
	});

	onDestroy(() => {
		if (buildInterval) clearInterval(buildInterval);
		if (repoInterval) clearInterval(repoInterval);
	});
</script>

<svelte:head>
	<title>Сборка и ветки | olcRTC Manager</title>
</svelte:head>

<div class="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	{#if repoSyncing}
		<div
			class="absolute inset-0 z-50 flex items-center justify-center rounded-xl border border-purple-500/20 bg-black/50 backdrop-blur-md"
		>
			<div class="flex flex-col items-center gap-3 p-8">
				<div class="flex items-center gap-3">
					<Loader2 class="h-5 w-5 animate-spin text-purple-300" />
					<span class="text-sm font-bold text-purple-200 uppercase tracking-wider"
						>Идет подготовка репозитория…</span
					>
				</div>
				<p class="text-xs text-zinc-300/80 text-center">
					Это может занять несколько минут при первом клонировании.
				</p>
			</div>
		</div>
	{/if}
	<div class="mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Сборка проекта</h1>
		<p class="mt-1 text-sm text-zinc-500">
			Управление ветками исходного кода olcrtc и компиляция бинарного исполняемого файла из сурсов
		</p>
	</div>

	{#if form?.error}
		<div
			class="mb-6 flex items-center gap-3 border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300"
		>
			<span class="font-bold text-red-400">Ошибка:</span>
			<span>{form.error}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-2">
			{#if data.currentCommit}
				<div class="border border-zinc-800 bg-zinc-900 p-6 shadow-md">
					<h2
						class="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase"
					>
						<GitCommit class="h-4.5 w-4.5 text-zinc-500" />
						<span>Текущий коммит исходного кода</span>
					</h2>

					<div class="space-y-4">
						<div class="border border-zinc-800 bg-zinc-950 p-4">
							<span class="font-mono text-xs font-semibold text-zinc-500"
								>{data.currentCommit.hash}</span
							>
							<p class="mt-1.5 text-sm leading-snug font-semibold text-white">
								{data.currentCommit.subject}
							</p>
						</div>

						<div class="grid grid-cols-2 gap-4 text-xs text-zinc-400">
							<div class="flex items-center gap-2">
								<User class="h-4 w-4 text-zinc-500" />
								<span
									>Автор: <strong class="text-zinc-300">{data.currentCommit.author}</strong></span
								>
							</div>
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4 text-zinc-500" />
								<span
									>Дата: <strong class="text-zinc-300"
										>{data.currentCommit.date.split(' ')[0]}</strong
									></span
								>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex flex-col border border-zinc-800 bg-zinc-900 p-6 shadow-md">
				<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
					<h2 class="flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
						<Cpu class="h-5 w-5 text-zinc-500" />
						<span>Компилятор (Mage compiler)</span>
					</h2>

					<button
						type="button"
						onclick={triggerBuild}
						disabled={isBuilding || repoSyncing}
						class="flex cursor-pointer items-center gap-2 bg-white px-6 py-2.5 text-xs font-semibold text-black shadow-sm hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isBuilding}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Идет сборка...</span>
						{:else}
							<RefreshCw class="h-4 w-4" />
							<span>Запустить сборку (Mage build)</span>
						{/if}
					</button>
				</div>

				<Terminal
					logs={buildLogs}
					title="Журнал компиляции"
					statusType={isBuilding
						? 'running'
						: buildSuccess === true
							? 'success'
							: buildSuccess === false
								? 'error'
								: 'idle'}
					statusText={isBuilding
						? 'Сборка активна'
						: buildSuccess === true
							? 'Успешно собрано'
							: buildSuccess === false
								? 'Сборка провалена'
								: 'Готов'}
					emptyText="Журнал сборки пуст. Запустите компиляцию, чтобы увидеть вывод."
					heightClass="h-80"
				/>
			</div>
		</div>

		<div class="border border-zinc-800 bg-zinc-900 p-6 shadow-md">
			<h2
				class="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase"
			>
				<GitBranch class="h-4.5 w-4.5 text-zinc-500" />
				<span>Ветки репозитория</span>
			</h2>

			<div class="space-y-3">
				{#each data.branches as branch (branch.name)}
					<div class="flex items-center justify-between border border-zinc-800 bg-zinc-950 p-3">
						<div class="flex min-w-0 flex-col">
							<span class="truncate pr-2 text-sm font-semibold text-white">{branch.name}</span>
							<span
								class="mt-0.5 text-[9px] font-bold tracking-widest uppercase {branch.isRemote
									? 'text-zinc-500'
									: 'text-violet-400'}"
							>
								{branch.isRemote ? 'remote' : 'local'}
							</span>
						</div>

						{#if branch.isCurrent}
							<span
								class="flex items-center gap-1.5 border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-bold text-emerald-400"
							>
								<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
								<span>Активная</span>
							</span>
						{:else}
							<form action="?/checkout&name={branch.name}" method="POST" use:enhance>
								<button
									type="submit"
									disabled={isBuilding || repoSyncing}
									class="flex cursor-pointer items-center gap-1 border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-[10px] font-bold text-zinc-300 uppercase hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<span>Выбрать</span>
									<ChevronRight class="h-3.5 w-3.5" />
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
