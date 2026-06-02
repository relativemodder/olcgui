<script lang="ts">
	import { Link, Key, Terminal as TerminalIcon } from 'lucide-svelte';
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import { metroIntro } from '$lib/motion/metro';

	let { liveShareUrl, liveYaml, liveClientRunCommand, mode } = $props<{
		liveShareUrl: string;
		liveYaml: string;
		liveClientRunCommand: string;
		mode: 'srv' | 'cnc';
	}>();
</script>

<div class="flex flex-col gap-6">
	<div use:metroIntro class="ui-panel ui-metro-surface flex flex-col">
		<div class="ui-panel-header">
			<h3 class="ui-title flex items-center gap-2 text-xl font-light">
				<Link class="h-4 w-4 text-[color:var(--ui-muted)]" />
				<span>Ссылка</span>
			</h3>
			<CopyButton text={liveShareUrl} />
		</div>

		<div class="ui-panel-body">
			<pre
				use:metroIntro={{ rotation: 42, x: -10, z: -22, stagger: 32 }}
				class="ui-code ui-metro-surface overflow-x-auto p-3.5 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap select-all">{liveShareUrl}</pre>
		</div>
	</div>

	<div use:metroIntro class="ui-panel ui-metro-surface flex flex-col">
		<div class="ui-panel-header">
			<h3 class="ui-title flex items-center gap-2 text-xl font-light">
				<Key class="h-4 w-4 text-[color:var(--ui-muted)]" />
				<span>YAML конфиг</span>
			</h3>
			<CopyButton text={liveYaml} />
		</div>

		<div class="ui-panel-body">
			<pre
				use:metroIntro={{ rotation: 42, x: -10, z: -22, stagger: 32 }}
				class="ui-code ui-metro-surface overflow-x-auto p-4 font-mono text-[10px] leading-relaxed whitespace-pre-wrap select-all sm:text-[11px]">{liveYaml}</pre>
		</div>
	</div>

	{#if mode === 'cnc'}
		<div use:metroIntro class="ui-panel ui-metro-surface flex flex-col">
			<div class="ui-panel-header">
				<h3 class="ui-title flex items-center gap-2 text-xl font-light">
					<TerminalIcon class="h-4 w-4 text-[color:var(--ui-muted)]" />
					<span>Строка запуска бинарника</span>
				</h3>
				<CopyButton text={liveClientRunCommand} />
			</div>

			<div class="ui-panel-body">
				<code
					use:metroIntro={{ rotation: 42, x: -10, z: -22, stagger: 32 }}
					class="ui-code ui-metro-surface overflow-x-auto p-3 font-mono text-[10px] leading-relaxed tracking-tight select-all sm:text-[11px]"
					>{liveClientRunCommand}</code
				>
			</div>
		</div>
	{/if}
</div>
