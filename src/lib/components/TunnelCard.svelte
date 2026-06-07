<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { getContext } from 'svelte';
	import {
		Globe,
		Wifi,
		KeyRound,
		Play,
		RefreshCw,
		Check,
		X as XIcon,
		Settings,
		Terminal as TerminalIcon,
		Trash2,
		Square
	} from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StatusIndicator from '$lib/components/ui/StatusIndicator.svelte';
	import { intro } from '$lib/motion/intro';
	import { showMetroAlert, showMetroConfirm } from '$lib/metroAlert';
	import { APP_SETTINGS_CONTEXT, type AppSettingsStores } from '$lib/stores/appSettings';
	import { api, ApiError } from '$lib/api';

	const { tileVisibility } = getContext<AppSettingsStores>(APP_SETTINGS_CONTEXT);

	let {
		inst,
		status = inst.status || 'stopped',
		autoRestart = inst.autoRestart || false,
		toggleLogDrawer = () => {},
		updateOptimisticStatus = () => {},
		updateOptimisticAutoRestart = () => {}
	} = $props();

	let isStopping = $state(false);
	let isStarting = $state(false);
	let isRestarting = $state(false);
	let isTogglingAutoRestart = $state(false);

	function showActionError(message: string) {
		showMetroAlert(message, {
			title: 'Ошибка действия',
			tone: 'error'
		});
	}

	async function handleStart() {
		if (isStarting) return;
		isStarting = true;
		updateOptimisticStatus(inst.id, 'running');

		try {
			await api.instances.start(inst.id);
		} catch (error) {
			updateOptimisticStatus(inst.id, 'stopped');
			showActionError(error instanceof ApiError ? error.message : 'Произошла ошибка при запуске');
		} finally {
			isStarting = false;
		}
	}

	async function handleStop() {
		if (isStopping) return;
		isStopping = true;
		updateOptimisticStatus(inst.id, 'stopped');

		try {
			await api.instances.stop(inst.id);
		} catch (error) {
			updateOptimisticStatus(inst.id, 'running');
			showActionError(error instanceof ApiError ? error.message : 'Произошла ошибка при остановке');
		} finally {
			isStopping = false;
		}
	}

	async function handleRestart() {
		if (isRestarting) return;
		isRestarting = true;
		updateOptimisticStatus(inst.id, 'restarting');

		try {
			await api.instances.restart(inst.id);
			updateOptimisticStatus(inst.id, 'running');
		} catch (error) {
			updateOptimisticStatus(inst.id, 'running');
			showActionError(
				error instanceof ApiError ? error.message : 'Произошла ошибка при перезапуске'
			);
		} finally {
			isRestarting = false;
		}
	}

	async function handleToggleAutoRestart() {
		if (isTogglingAutoRestart) return;
		isTogglingAutoRestart = true;
		updateOptimisticAutoRestart(inst.id, !autoRestart);

		try {
			await api.instances.toggleAutoRestart(inst.id);
		} catch (error) {
			updateOptimisticAutoRestart(inst.id, autoRestart);
			showActionError(error instanceof ApiError ? error.message : 'Произошла ошибка');
		} finally {
			isTogglingAutoRestart = false;
		}
	}

	async function handleDelete() {
		const confirmed = await showMetroConfirm('Удалить туннель «' + inst.name + '»?', {
			title: 'Удаление туннеля',
			tone: 'warning',
			confirmLabel: 'Удалить',
			cancelLabel: 'Отмена'
		});

		if (!confirmed) return;

		try {
			await api.instances.remove(inst.id);
			await invalidateAll();
		} catch (error) {
			showActionError(error instanceof ApiError ? error.message : 'Ошибка при удалении');
		}
	}
</script>

<div class="flex flex-col gap-4 p-6">
	<div class="flex items-center gap-3">
		<StatusIndicator status={status as 'running' | 'restarting' | 'error' | 'stopped'} />
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
				<h2 class="ui-title ui-instance-card-title text-2xl font-light">
					{inst.name}
				</h2>
				<Badge>
					{inst.mode === 'srv' ? 'СЕРВЕР' : 'КЛИЕНТ'}
				</Badge>
				<Badge variant="slate">
					{inst.provider}
				</Badge>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div
			class="grid min-w-0 flex-1 grid-cols-1 gap-1.5 text-xs text-[color:var(--ui-muted)] sm:grid-cols-[minmax(0,1fr)_auto]"
		>
			{#if $tileVisibility.roomUrl}
				<span use:intro class="ui-config-tile ui-metro-surface">
					<Globe class="h-3.5 w-3.5 shrink-0" />
					<span class="min-w-0 flex-1 truncate" title={inst.roomUrl}>{inst.roomUrl}</span>
				</span>
			{/if}
			{#if $tileVisibility.cryptoKey}
				<span use:intro class="ui-config-tile ui-metro-surface">
					<KeyRound class="h-3.5 w-3.5 shrink-0" />
					<span class="font-mono text-[10px] tracking-tight"
						>{inst.cryptoKey.substring(0, 10)}...</span
					>
				</span>
			{/if}
			{#if inst.mode === 'cnc' && $tileVisibility.socksInfo}
				<span use:intro class="ui-config-tile ui-metro-surface sm:col-span-2">
					<Wifi class="h-3.5 w-3.5 shrink-0" />
					<span>SOCKS5: <strong>{inst.socksHost}:{inst.socksPort}</strong></span>
				</span>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-3">
			{#if status === 'running' || status === 'restarting'}
				<div class="w-full sm:w-auto">
					<button
						type="button"
						disabled={isRestarting || isStopping}
						class="ui-button ui-button-primary h-9 w-full cursor-pointer justify-center px-4 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						title="Перезапустить туннель одним действием"
						onclick={handleRestart}
					>
						<RefreshCw class="h-3.5 w-3.5 shrink-0" />
						<span>Рестарт</span>
					</button>
				</div>

				<div class="w-full sm:w-auto">
					<button
						type="button"
						disabled={isStopping}
						class="ui-button h-9 w-full cursor-pointer justify-center px-4 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						onclick={handleStop}
					>
						<Square class="h-3.5 w-3.5 shrink-0" />
						<span>Остановить</span>
					</button>
				</div>
			{:else}
				<div class="w-full sm:w-auto">
					<button
						type="button"
						disabled={isStarting}
						class="ui-button ui-button-primary h-9 w-full cursor-pointer justify-center px-4 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						onclick={handleStart}
					>
						<Play class="h-3.5 w-3.5 shrink-0 fill-current" />
						<span>Запустить</span>
					</button>
				</div>
			{/if}

			<div>
				<button
					type="button"
					disabled={isTogglingAutoRestart}
					class="ui-button h-9 cursor-pointer px-3.5 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50"
					title="Автоматический перезапуск в случае сбоев"
					onclick={handleToggleAutoRestart}
				>
					{#if autoRestart}
						<Check class="h-4 w-4 shrink-0 text-[color:var(--ui-accent)]" />
						<span>Авто-старт</span>
					{:else}
						<XIcon class="h-4 w-4 shrink-0 text-[color:var(--ui-muted)]" />
						<span class="text-[color:var(--ui-muted)]">Авто-старт</span>
					{/if}
				</button>
			</div>

			<a
				href="/wizard?edit={inst.id}"
				class="ui-button h-9 cursor-pointer px-3.5 text-xs font-normal"
				title="Редактировать параметры и получить ссылку обмена"
			>
				<Settings class="h-3.5 w-3.5 shrink-0 text-[color:var(--ui-muted)]" />
				<span>Настройки</span>
			</a>

			<button
				type="button"
				onclick={() => toggleLogDrawer(inst.id)}
				class="ui-button h-9 cursor-pointer px-3.5 text-xs font-normal"
			>
				<TerminalIcon class="h-3.5 w-3.5 shrink-0" />
				<span>Логи</span>
			</button>

			<div>
				<button
					type="button"
					class="ui-button ui-button-icon ui-button-danger cursor-pointer"
					title="Удалить туннель"
					onclick={handleDelete}
				>
					<Trash2 class="h-3.5 w-3.5 shrink-0" />
				</button>
			</div>
		</div>
	</div>
</div>
