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
	import { canPollNow, createSerialPoller } from '$lib/client/serialPoller';
	import {
		Terminal,
		UploadBinaryPanel,
		Panel,
		PageHeader,
		ErrorAlert,
		StatusIndicator
	} from '$lib';

	let { data, form } = $props();

	let isAdmin = $derived(data.isAdmin);
	let isBuilding = $state(false);
	let buildLogs = $state<string[]>([]);
	let buildSuccess = $state<boolean | null>(null);
	let buildStartInFlight = $state(false);

	let repoSyncing = $state<boolean>(false);
	let repoPullInFlight = $state(false);

	const repoPoller = createSerialPoller({
		intervalMs: 800,
		failureIntervalMs: 5000,
		shouldRun: canPollNow,
		async run(signal) {
			const res = await fetch('/api/repo', { signal });
			if (!res.ok) {
				throw new Error(`Repo status request failed with ${res.status}`);
			}

			const info = await res.json();
			repoSyncing = !!info.repoSyncing;

			if (!repoSyncing) {
				return false;
			}
		},
		onError(error) {
			console.error('Failed to poll repo sync status:', error);
		}
	});

	const buildPoller = createSerialPoller({
		intervalMs: 1000,
		failureIntervalMs: 5000,
		shouldRun: canPollNow,
		async run(signal) {
			const res = await fetch('/api/builds', { signal });
			if (!res.ok) {
				throw new Error(`Build status request failed with ${res.status}`);
			}

			const info = await res.json();
			isBuilding = info.isBuilding;
			buildLogs = info.logs;
			buildSuccess = info.success;

			if (!isBuilding) {
				return false;
			}
		},
		onError(error) {
			console.error('Failed to poll compile status:', error);
		}
	});

	function triggerVisiblePoll() {
		if (!canPollNow() || !isAdmin) return;

		if (repoSyncing || repoPoller.isActive()) {
			repoPoller.trigger();
		}

		if (isBuilding || buildPoller.isActive()) {
			buildPoller.trigger();
		}
	}

	async function triggerBuild() {
		if (buildStartInFlight || isBuilding || repoSyncing) return;

		buildStartInFlight = true;
		try {
			const res = await fetch('/api/builds', { method: 'POST' });
			if (res.ok) {
				isBuilding = true;
				buildLogs = ['[Build] Triggering compilation...'];
				buildSuccess = null;
				buildPoller.trigger();
			}
		} catch (e) {
			console.error('Failed to start build:', e);
		} finally {
			buildStartInFlight = false;
		}
	}

	async function triggerRepoPull() {
		if (repoPullInFlight || repoSyncing) return;

		repoPullInFlight = true;
		try {
			const res = await fetch('/api/repo/pull', { method: 'POST' });
			if (res.ok) {
				repoSyncing = true;
				repoPoller.trigger();
			}
		} catch (e) {
			console.error('Failed to start repo pull:', e);
		} finally {
			repoPullInFlight = false;
		}
	}

	onMount(async () => {
		if (isAdmin) {
			repoPoller.trigger();
			buildPoller.trigger();
		}
		document.addEventListener('visibilitychange', triggerVisiblePoll);
		window.addEventListener('online', triggerVisiblePoll);
	});

	onDestroy(() => {
		buildPoller.stop();
		repoPoller.stop();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', triggerVisiblePoll);
		}
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', triggerVisiblePoll);
		}
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
			{#if isAdmin}
				{#snippet repoButton()}
					<button
						type="button"
						onclick={triggerRepoPull}
						disabled={repoPullInFlight || repoSyncing}
						class="ui-button ui-button-primary cursor-pointer px-6 py-2.5 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 max-sm:w-full"
					>
						{#if repoPullInFlight || repoSyncing}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Идет pull...</span>
						{:else}
							<RefreshCw class="h-4 w-4" />
							<span>Pull репозитория</span>
						{/if}
					</button>
				{/snippet}
				{#snippet repoActions()}
					<div class="hidden sm:block">
						{@render repoButton()}
					</div>
				{/snippet}
				<Panel title="Репозиторий (olcrtc)" icon={RefreshCw} actions={repoActions}>
					<p class="text-xs text-[color:var(--ui-muted)]">Pull выполняется только по кнопке.</p>
					<div class="max-sm:mt-4 sm:hidden">
						{@render repoButton()}
					</div>
				</Panel>
			{/if}

			{#if data.currentCommit}
				<Panel title="Текущий коммит исходного кода" icon={GitCommit}>
					<div class="space-y-4">
						<div class="border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] p-4">
							<span
								class="block max-w-full truncate font-mono text-sm font-normal text-[color:var(--ui-muted)]"
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

			{#if isAdmin}
				{#snippet buildButton()}
					<button
						type="button"
						onclick={triggerBuild}
						disabled={buildStartInFlight || isBuilding || repoSyncing}
						class="ui-button ui-button-primary cursor-pointer px-6 py-2.5 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 max-sm:w-full"
					>
						{#if buildStartInFlight || isBuilding}
							<Loader2 class="h-4 w-4 animate-spin" />
							<span>Идет сборка...</span>
						{:else}
							<RefreshCw class="h-4 w-4" />
							<span>Запустить сборку (Mage build)</span>
						{/if}
					</button>
				{/snippet}
				{#snippet buildActions()}
					<div class="hidden sm:block">
						{@render buildButton()}
					</div>
				{/snippet}
				<Panel title="Компилятор (Mage compiler)" icon={Cpu} actions={buildActions}>
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

					<div class="max-sm:mt-4 sm:hidden">
						{@render buildButton()}
					</div>
				</Panel>

				<UploadBinaryPanel />
			{/if}
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
						{:else if isAdmin}
							<form action="?/checkout&name={branch.name}" method="POST" use:enhance>
								<button
									type="submit"
									disabled={buildStartInFlight || isBuilding || repoPullInFlight || repoSyncing}
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
