<script lang="ts">
	import { enhance } from '$app/forms';
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
		Trash2
	} from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import StatusIndicator from '$lib/components/ui/StatusIndicator.svelte';
	import { intro } from '$lib/motion/intro';
	import { showMetroAlert, showMetroConfirm } from '$lib/metroAlert';
	import { tileVisibility } from '$lib/stores/tileVisibility';

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
	let deleteForm: HTMLFormElement;
	let deleteConfirmed = false;

	function showActionError(message: string) {
		showMetroAlert(message, {
			title: 'Ошибка действия',
			tone: 'error'
		});
	}

	function actionErrorMessage(error: unknown, fallback: string) {
		return typeof error === 'string' && error.trim() ? error : fallback;
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
				<form
					class="w-full sm:w-auto"
					method="POST"
					action="?/restart&id={inst.id}"
					use:enhance={({ cancel }) => {
						if (isRestarting) {
							cancel();
							return;
						}
						isRestarting = true;
						updateOptimisticStatus(inst.id, 'restarting');
						return async ({ result }) => {
							isRestarting = false;
							if (result.type === 'failure') {
								updateOptimisticStatus(inst.id, 'running');
								showActionError(
									actionErrorMessage(result.data?.error, 'Произошла ошибка при перезапуске')
								);
							} else if (result.type === 'error') {
								updateOptimisticStatus(inst.id, 'running');
								showActionError(result.error?.message || 'Произошла ошибка при перезапуске');
							} else {
								updateOptimisticStatus(inst.id, 'running');
							}
						};
					}}
				>
					<button
						type="submit"
						disabled={isRestarting || isStopping}
						class="ui-button ui-button-primary h-9 w-full cursor-pointer justify-center px-4 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						title="Перезапустить туннель одним действием"
					>
						<RefreshCw class="h-3.5 w-3.5 shrink-0" />
						<span>Рестарт</span>
					</button>
				</form>

				<form
					class="w-full sm:w-auto"
					method="POST"
					action="?/stop&id={inst.id}"
					use:enhance={({ cancel }) => {
						if (isStopping) {
							cancel();
							return;
						}
						isStopping = true;
						updateOptimisticStatus(inst.id, 'stopped');
						return async ({ result }) => {
							isStopping = false;
							if (result.type === 'failure') {
								updateOptimisticStatus(inst.id, 'running');
								showActionError(
									actionErrorMessage(result.data?.error, 'Произошла ошибка при остановке')
								);
							} else if (result.type === 'error') {
								updateOptimisticStatus(inst.id, 'running');
								showActionError(result.error?.message || 'Произошла ошибка при остановке');
							}
						};
					}}
				>
					<button
						type="submit"
						disabled={isStopping}
						class="ui-button h-9 w-full cursor-pointer justify-center px-4 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
					>
						<Square class="h-3.5 w-3.5 shrink-0" />
						<span>Остановить</span>
					</button>
				</form>
			{:else}
				<form
					class="w-full sm:w-auto"
					method="POST"
					action="?/start&id={inst.id}"
					use:enhance={({ cancel }) => {
						if (isStarting) {
							cancel();
							return;
						}
						isStarting = true;
						updateOptimisticStatus(inst.id, 'running');
						return async ({ result }) => {
							isStarting = false;
							if (result.type === 'failure') {
								updateOptimisticStatus(inst.id, 'stopped');
								showActionError(
									actionErrorMessage(result.data?.error, 'Произошла ошибка при запуске')
								);
							} else if (result.type === 'error') {
								updateOptimisticStatus(inst.id, 'stopped');
								showActionError(result.error?.message || 'Произошла ошибка при запуске');
							}
						};
					}}
				>
					<button
						type="submit"
						disabled={isStarting}
						class="ui-button ui-button-primary h-9 w-full cursor-pointer justify-center px-4 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
					>
						<Play class="h-3.5 w-3.5 shrink-0 fill-current" />
						<span>Запустить</span>
					</button>
				</form>
			{/if}

			<form
				method="POST"
				action="?/toggleAutoRestart&id={inst.id}"
				use:enhance={({ cancel }) => {
					if (isTogglingAutoRestart) {
						cancel();
						return;
					}
					isTogglingAutoRestart = true;
					updateOptimisticAutoRestart(inst.id, !autoRestart);
					return async ({ result }) => {
						isTogglingAutoRestart = false;
						if (result.type === 'failure') {
							updateOptimisticAutoRestart(inst.id, autoRestart);
							showActionError(actionErrorMessage(result.data?.error, 'Произошла ошибка'));
						} else if (result.type === 'error') {
							updateOptimisticAutoRestart(inst.id, autoRestart);
							showActionError(result.error?.message || 'Произошла ошибка');
						}
					};
				}}
			>
				<button
					type="submit"
					disabled={isTogglingAutoRestart}
					class="ui-button h-9 cursor-pointer px-3.5 text-xs font-normal disabled:cursor-not-allowed disabled:opacity-50"
					title="Автоматический перезапуск в случае сбоев"
				>
					{#if autoRestart}
						<Check class="h-4 w-4 shrink-0 text-[color:var(--ui-accent)]" />
						<span>Авто-старт</span>
					{:else}
						<XIcon class="h-4 w-4 shrink-0 text-[color:var(--ui-muted)]" />
						<span class="text-[color:var(--ui-muted)]">Авто-старт</span>
					{/if}
				</button>
			</form>

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

			<form
				bind:this={deleteForm}
				action="?/delete&id={inst.id}"
				method="POST"
				use:enhance={({ cancel }) => {
					if (!deleteConfirmed) {
						cancel();
						return;
					}
					deleteConfirmed = false;
					return async ({ result, update }) => {
						if (result.type === 'failure') {
							showActionError(actionErrorMessage(result.data?.error, 'Ошибка при удалении'));
						} else if (result.type === 'error') {
							showActionError(result.error?.message || 'Ошибка при удалении');
						}
						await update();
					};
				}}
			>
				<button
					type="submit"
					class="ui-button ui-button-icon ui-button-danger cursor-pointer"
					title="Удалить туннель"
					onclick={async (event) => {
						event.preventDefault();
						const confirmed = await showMetroConfirm('Удалить туннель «' + inst.name + '»?', {
							title: 'Удаление туннеля',
							tone: 'warning',
							confirmLabel: 'Удалить',
							cancelLabel: 'Отмена'
						});

						if (confirmed) {
							deleteConfirmed = true;
							deleteForm.requestSubmit();
						}
					}}
				>
					<Trash2 class="h-3.5 w-3.5 shrink-0" />
				</button>
			</form>
		</div>
	</div>
</div>
