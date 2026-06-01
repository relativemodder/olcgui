<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Globe,
		Wifi,
		KeyRound,
		Play,
		Square,
		ToggleRight,
		ToggleLeft,
		Settings,
		Terminal as TerminalIcon,
		Trash2
	} from 'lucide-svelte';

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
	let isTogglingAutoRestart = $state(false);
</script>

<div
	class="hover:border-zinc-750 flex flex-col justify-between gap-6 border border-zinc-800 bg-zinc-900 p-6 shadow-md lg:flex-row lg:items-center"
>
	<div class="flex items-start gap-4">
		<div class="mt-1 flex shrink-0 items-center justify-center">
			{#if status === 'running'}
				<div class="h-3 w-3 rounded-full bg-emerald-500" title="Активен"></div>
			{:else if status === 'restarting'}
				<div class="h-3 w-3 animate-pulse rounded-full bg-amber-500" title="Перезапуск"></div>
			{:else if status === 'error'}
				<div class="h-3 w-3 rounded-full bg-red-500" title="Ошибка"></div>
			{:else}
				<div class="h-3 w-3 rounded-full bg-zinc-600" title="Остановлен"></div>
			{/if}
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-3">
				<a
					href="/wizard?edit={inst.id}"
					class="hover:text-zinc-400"
					title="Нажмите для редактирования и копирования ссылки обмена"
				>
					<h2
						class="text-lg font-bold tracking-tight text-white decoration-zinc-500 underline-offset-4 hover:underline"
					>
						{inst.name}
					</h2>
				</a>
				<span
					class="border border-zinc-700/50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase {inst.mode ===
					'srv'
						? 'bg-zinc-700'
						: 'bg-zinc-700'}"
				>
					{inst.mode === 'srv' ? 'СЕРВЕР' : 'КЛИЕНТ'}
				</span>
				<span
					class="border border-slate-700 bg-slate-900 px-2 py-0.5 text-[9px] font-bold tracking-wider text-slate-300 uppercase"
				>
					{inst.provider}
				</span>
			</div>

			<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
				<span class="flex items-center gap-1.5">
					<Globe class="h-3.5 w-3.5 shrink-0" />
					<span class="max-w-[200px] truncate" title={inst.roomUrl}>{inst.roomUrl}</span>
				</span>
				{#if inst.mode === 'cnc'}
					<span class="flex items-center gap-1.5">
						<Wifi class="h-3.5 w-3.5 shrink-0" />
						<span
							>SOCKS5: <strong class="font-semibold text-zinc-300"
								>{inst.socksHost}:{inst.socksPort}</strong
							></span
						>
					</span>
				{/if}
				<span class="flex items-center gap-1.5">
					<KeyRound class="h-3.5 w-3.5 shrink-0" />
					<span class="font-mono text-[10px] tracking-tight"
						>{inst.cryptoKey.substring(0, 10)}...</span
					>
				</span>
			</div>
		</div>
	</div>

	<div class="flex flex-wrap items-center gap-3 lg:self-center">
		{#if status === 'running' || status === 'restarting'}
			<button
				type="button"
				disabled={isStopping}
				onclick={async () => {
					if (isStopping) return;
					isStopping = true;
					try {
						updateOptimisticStatus(inst.id, 'stopped');
						await fetch(`?/stop&id=${inst.id}`, { method: 'POST', body: new FormData() });
					} finally {
						isStopping = false;
					}
				}}
				class="border-zinc-750 flex h-9 cursor-pointer items-center gap-2 border bg-zinc-800 px-4 text-xs text-zinc-300 shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Square class="h-3.5 w-3.5 shrink-0" />
				<span>Остановить</span>
			</button>
		{:else}
			<button
				type="button"
				disabled={isStarting}
				onclick={async () => {
					if (isStarting) return;
					isStarting = true;
					try {
						updateOptimisticStatus(inst.id, 'running');
						await fetch(`?/start&id=${inst.id}`, { method: 'POST', body: new FormData() });
					} finally {
						isStarting = false;
					}
				}}
				class="flex h-9 cursor-pointer items-center gap-2 border border-transparent bg-white px-4 text-xs font-semibold text-black shadow-sm hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Play class="h-3.5 w-3.5 shrink-0 fill-current" />
				<span>Запустить</span>
			</button>
		{/if}

		<button
			type="button"
			disabled={isTogglingAutoRestart}
			onclick={async () => {
				if (isTogglingAutoRestart) return;
				isTogglingAutoRestart = true;
				try {
					updateOptimisticAutoRestart(inst.id, !autoRestart);
					await fetch(`?/toggleAutoRestart&id=${inst.id}`, {
						method: 'POST',
						body: new FormData()
					});
				} finally {
					isTogglingAutoRestart = false;
				}
			}}
			class="border-zinc-750 flex h-9 cursor-pointer items-center gap-2 border bg-zinc-800 px-3.5 text-xs hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
			title="Автоматический перезапуск в случае сбоев"
		>
			{#if autoRestart}
				<ToggleRight class="h-5 w-5 shrink-0 text-emerald-400" />
				<span class="font-medium text-zinc-300">Авто-старт</span>
			{:else}
				<ToggleLeft class="h-5 w-5 shrink-0 text-zinc-500" />
				<span class="font-medium text-zinc-500">Авто-старт</span>
			{/if}
		</button>

		<a
			href="/wizard?edit={inst.id}"
			class="border-zinc-750 flex h-9 cursor-pointer items-center gap-2 border bg-zinc-800 px-3.5 text-xs text-zinc-300 shadow-sm hover:bg-zinc-700"
			title="Редактировать параметры и получить ссылку обмена"
		>
			<Settings class="h-3.5 w-3.5 shrink-0 text-zinc-400" />
			<span>Настройки</span>
		</a>

		<button
			type="button"
			onclick={() => toggleLogDrawer(inst.id)}
			class="border-zinc-750 flex h-9 cursor-pointer items-center gap-2 border bg-zinc-800 px-3.5 text-xs text-zinc-300 shadow-sm hover:bg-zinc-700"
		>
			<TerminalIcon class="h-3.5 w-3.5 shrink-0" />
			<span>Логи</span>
		</button>

		<form action="?/delete&id={inst.id}" method="POST" use:enhance>
			<button
				type="submit"
				class="border-zinc-750 flex h-9 w-9 cursor-pointer items-center justify-center border bg-zinc-800 text-zinc-400 shadow-sm hover:border-red-600 hover:bg-red-950/50 hover:text-red-400"
				title="Удалить туннель"
			>
				<Trash2 class="h-3.5 w-3.5 shrink-0" />
			</button>
		</form>
	</div>
</div>
