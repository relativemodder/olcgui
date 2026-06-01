<script lang="ts">
	import { Link, Copy, Check, Key, Terminal as TerminalIcon } from 'lucide-svelte';

	let { liveShareUrl, liveYaml, liveClientRunCommand, mode } = $props<{
		liveShareUrl: string;
		liveYaml: string;
		liveClientRunCommand: string;
		mode: 'srv' | 'cnc';
	}>();

	let copiedYaml = $state(false);
	let copiedCommand = $state(false);
	let copiedShare = $state(false);

	async function copyToClipboard(text: string, flag: 'yaml' | 'cmd' | 'share') {
		try {
			await navigator.clipboard.writeText(text);
			if (flag === 'yaml') {
				copiedYaml = true;
				setTimeout(() => (copiedYaml = false), 2000);
			} else if (flag === 'cmd') {
				copiedCommand = true;
				setTimeout(() => (copiedCommand = false), 2000);
			} else if (flag === 'share') {
				copiedShare = true;
				setTimeout(() => (copiedShare = false), 2000);
			}
		} catch {}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col border border-zinc-800 bg-zinc-900 p-6 shadow-md">
		<div class="mb-3 flex items-center justify-between">
			<h3 class="flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
				<Link class="h-4 w-4 text-zinc-500" />
				<span>Ссылка</span>
			</h3>
			<button
				type="button"
				onclick={() => copyToClipboard(liveShareUrl, 'share')}
				class="flex cursor-pointer items-center gap-1.5 border border-zinc-800 px-3 py-1 text-[10px] font-bold text-zinc-300 uppercase select-none hover:bg-zinc-200 hover:text-black"
			>
				{#if copiedShare}
					<Check class="h-3 w-3 text-emerald-400" />
					<span class="text-emerald-400">Скопировано</span>
				{:else}
					<Copy class="h-3 w-3" />
					<span>Скопировать</span>
				{/if}
			</button>
		</div>

		<pre
			class="overflow-x-auto border border-zinc-800 bg-black p-3.5 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap text-zinc-300 shadow-inner select-all">{liveShareUrl}</pre>
	</div>

	<div class="flex flex-col border border-zinc-800 bg-zinc-900 p-6 shadow-md">
		<div class="mb-4 flex items-center justify-between">
			<h3 class="flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
				<Key class="h-4 w-4 text-zinc-500" />
				<span>YAML конфиг</span>
			</h3>
			<button
				type="button"
				onclick={() => copyToClipboard(liveYaml, 'yaml')}
				class="flex cursor-pointer items-center gap-1.5 border border-zinc-800 px-3 py-1 text-[10px] font-bold text-zinc-300 uppercase hover:bg-zinc-200 hover:text-black"
			>
				{#if copiedYaml}
					<Check class="h-3 w-3 text-emerald-400" />
					<span class="text-emerald-400">Скопировано</span>
				{:else}
					<Copy class="h-3 w-3" />
					<span>Скопировать</span>
				{/if}
			</button>
		</div>

		<pre
			class="overflow-x-auto border border-zinc-800 bg-black p-4 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-zinc-300 shadow-inner select-all sm:text-[11px]">{liveYaml}</pre>
	</div>

	{#if mode === 'cnc'}
		<div class="flex flex-col border border-zinc-800 bg-zinc-900 p-6 shadow-md">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase">
					<TerminalIcon class="h-4 w-4 text-zinc-500" />
					<span>Строка запуска бинарника</span>
				</h3>
				<button
					type="button"
					onclick={() => copyToClipboard(liveClientRunCommand, 'cmd')}
					class="flex cursor-pointer items-center gap-1.5 border border-zinc-800 px-3 py-1 text-[10px] font-bold text-zinc-300 uppercase hover:bg-zinc-200 hover:text-black"
				>
					{#if copiedCommand}
						<Check class="h-3 w-3 text-emerald-400" />
						<span class="text-emerald-400">Скопировано</span>
					{:else}
						<Copy class="h-3 w-3" />
						<span>Скопировать</span>
					{/if}
				</button>
			</div>

			<code
				class="overflow-x-auto border border-zinc-800 bg-black p-3 font-mono text-[10px] leading-relaxed tracking-tight text-emerald-400 shadow-inner select-all sm:text-[11px]"
				>{liveClientRunCommand}</code
			>
		</div>
	{/if}
</div>
