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
	import UploadBinaryPanel from '$lib/components/builds/UploadBinaryPanel.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ErrorAlert from '$lib/components/ui/ErrorAlert.svelte';
	import StatusIndicator from '$lib/components/ui/StatusIndicator.svelte';

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

				if (!repoSyncing && repoInterval) {
					clearInterval(repoInterval);
					repoInterval = null;
				}
			}
		} catch (e) {
			console.error('Failed to poll repo sync status:', e);
		}
	}

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

	async function triggerRepoPull() {
		try {
			const res = await fetch('/api/repo/pull', { method: 'POST' });
			if (res.ok) {
				await pollRepoSync();
				if (repoSyncing && !repoInterval) {
					repoInterval = setInterval(pollRepoSync, 800);
				}
			}
		} catch (e) {
			console.error('Failed to start repo pull:', e);
		}
	}

	onMount(async () => {
		await pollRepoSync();
		if (repoSyncing) repoInterval = setInterval(pollRepoSync, 800);

		await pollBuild();
		if (isBuilding) buildInterval = setInterval(pollBuild, 1000);
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
			class="absolute inset-0 z-50 flex items-center justify-center border border-[color:var(--ui-border)] bg-[color:var(--ui-overlay)]"
		>
			<div class="flex flex-col items-center gap-3 p-8">
				<div class="flex items-center gap-3">
					<Loader2 class="h-5 w-5 animate-spin text-[color:var(--ui-muted)]" />
					<span class="text-xl font-thin tracking-wide text-[color:var(--ui-text)] uppercase"
						>Идет подготовка репозитория…</span
					>
				</div>
				<p class="text-center text-xs text-[color:var(--ui-muted)]">
					Это может занять несколько минут при первом клонировании.
				</p>
			</div>
		</div>
	{/if}

	<PageHeader title="Сборка проекта" description="Ветки и компиляция бинарника olcrtc" />

	<ErrorAlert message={form?.error ?? ''} />

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
		<div class="space-y-6 lg:col-span-2">
			<Panel title="Репозиторий (olcrtc)" icon={RefreshCw}>
				{#snippet actions()}
					<button
						type="button"
						onclick={triggerRepoPull}
						disabled={repoSyncing}
						class="ui-button ui-button-primary cursor-pointer px-6 py-2.5 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if repoSyncing}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Идет pull...</span>
						{:else}
							<RefreshCw class="h-4 w-4" />
							<span>Pull репозитория</span>
						{/if}
					</button>
				{/snippet}
				<p class="text-xs text-[color:var(--ui-muted)]">Pull выполняется только по кнопке.</p>
			</Panel>

			{#if data.currentCommit}
				<Panel title="Текущий коммит исходного кода" icon={GitCommit}>
					<div class="space-y-4">
						<div class="border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] p-4">
							<span class="font-mono text-sm font-normal text-[color:var(--ui-muted)]"
								>{data.currentCommit.hash}</span
							>
							<p class="mt-1.5 text-base leading-snug font-normal">
								{data.currentCommit.subject}
							</p>
						</div>

						<div class="grid grid-cols-2 gap-4 text-xs text-[color:var(--ui-muted)]">
							<div class="flex items-center gap-2">
								<User class="h-4 w-4 text-[color:var(--ui-muted)]" />
								<span
									>Автор: <strong class="text-[color:var(--ui-text)]"
										>{data.currentCommit.author}</strong
									></span
								>
							</div>
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4 text-[color:var(--ui-muted)]" />
								<span
									>Дата: <strong class="text-[color:var(--ui-text)]"
										>{data.currentCommit.date.split(' ')[0]}</strong
									></span
								>
							</div>
						</div>
					</div>
				</Panel>
			{/if}

			<Panel title="Компилятор (Mage compiler)" icon={Cpu}>
				{#snippet actions()}
					<button
						type="button"
						onclick={triggerBuild}
						disabled={isBuilding || repoSyncing}
						class="ui-button ui-button-primary cursor-pointer px-6 py-2.5 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isBuilding}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Идет сборка...</span>
						{:else}
							<RefreshCw class="h-4 w-4" />
							<span>Запустить сборку (Mage build)</span>
						{/if}
					</button>
				{/snippet}

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
					emptyText="Журнал пуст."
					heightClass="h-80"
				/>
			</Panel>

			<UploadBinaryPanel />
		</div>

		<Panel title="Ветки репозитория" icon={GitBranch}>
			<div class="space-y-3">
				{#each data.branches as branch (branch.name)}
					<div
						class="flex items-center justify-between border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] p-3"
					>
						<div class="flex min-w-0 flex-col">
							<span class="truncate pr-2 text-base font-normal">{branch.name}</span>
							<span
								class="mt-0.5 text-xs font-normal tracking-wide uppercase {branch.isRemote
									? 'text-[color:var(--ui-muted)]'
									: 'text-[color:var(--ui-text)]'}"
							>
								{branch.isRemote ? 'remote' : 'local'}
							</span>
						</div>

						{#if branch.isCurrent}
							<span
								class="ui-chip ui-badge-success flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
							>
								<StatusIndicator status="active" />
								<span>Активная</span>
							</span>
						{:else}
							<form action="?/checkout&name={branch.name}" method="POST" use:enhance>
								<button
									type="submit"
									disabled={isBuilding || repoSyncing}
									class="ui-button cursor-pointer items-center gap-1 px-3 py-1.5 text-xs font-normal uppercase disabled:cursor-not-allowed disabled:opacity-50"
								>
									<span>Выбрать</span>
									<ChevronRight class="h-3.5 w-3.5" />
								</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		</Panel>
	</div>
</div>
