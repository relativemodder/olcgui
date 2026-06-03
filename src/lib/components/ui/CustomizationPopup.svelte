<script lang="ts">
	import { X, RotateCcw } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { animationMode } from '$lib/stores/animation';
	import { colorScheme } from '$lib/stores/colorScheme';
	import { tileVisibility, type TileVisibility } from '$lib/stores/tileVisibility';
	import { colorSchemes } from '$lib/themes';
	import ToggleCard from '$lib/components/ui/ToggleCard.svelte';

	let {
		open,
		title = 'Кастомизация',
		onclose = () => {}
	}: {
		open: boolean;
		title?: string;
		onclose?: () => void;
	} = $props();

	let expandedGroups = $state<Record<string, boolean>>({
		systemMonitor: false,
		statCards: false
	});

	function toggleGroup(key: string) {
		expandedGroups[key] = !expandedGroups[key];
	}

	function resetDefaults() {
		$tileVisibility = {
			systemMonitor: true,
			cpuStat: true,
			ramStat: true,
			iowaitStat: true,
			networkStat: true,
			statCards: true,
			totalTunnelsStat: true,
			activeStat: true,
			restartingStat: true,
			errorStat: true,
			roomUrl: true,
			cryptoKey: true,
			socksInfo: true
		};
	}

	type TileGroup = {
		key: keyof TileVisibility;
		label: string;
		desc: string;
		children?: { key: keyof TileVisibility; label: string; desc: string }[];
	};

	const tileGroups: TileGroup[] = [
		{
			key: 'systemMonitor',
			label: 'Монитор системы',
			desc: 'Блок системных метрик',
			children: [
				{ key: 'cpuStat', label: 'Нагрузка ЦПУ', desc: 'Процент загрузки процессора' },
				{ key: 'ramStat', label: 'ОЗУ', desc: 'Использование оперативной памяти' },
				{ key: 'iowaitStat', label: 'Нагрузка IOWait', desc: 'Ожидание ввода-вывода' },
				{ key: 'networkStat', label: 'Сеть', desc: 'Скорость приёма и передачи' }
			]
		},
		{
			key: 'statCards',
			label: 'Сводка статистики',
			desc: 'Счётчики туннелей',
			children: [
				{ key: 'totalTunnelsStat', label: 'Всего туннелей', desc: '' },
				{ key: 'activeStat', label: 'Активно', desc: 'Работающие туннели' },
				{ key: 'restartingStat', label: 'В процессе перезапуска', desc: '' },
				{ key: 'errorStat', label: 'Ошибки', desc: 'Туннели в состоянии ошибки' }
			]
		}
	];

	const standaloneTiles: { key: keyof TileVisibility; label: string; desc: string }[] = [
		{ key: 'roomUrl', label: 'URL комнаты', desc: 'Плитка с адресом комнаты в карточке туннеля' },
		{ key: 'cryptoKey', label: 'Ключ шифрования', desc: 'Плитка с ключом в карточке туннеля' },
		{ key: 'socksInfo', label: 'SOCKS5', desc: 'Плитка с SOCKS5 в карточке клиента' }
	];
</script>

{#if open}
	<div
		class="ui-metro-alert-screen"
		role="presentation"
		onclick={onclose}
		onkeydown={(e) => e.key === 'Escape' && onclose()}
	>
		<div
			transition:fly={{ y: -28, duration: 220 }}
			class="ui-metro-alert-strip ui-metro-alert-info"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			aria-labelledby="customization-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div
				class="mx-auto flex w-full max-w-3xl flex-col px-4 py-5 sm:px-6"
				style="height: 100%; max-height: 600px;"
			>
				<div class="flex w-full shrink-0 items-start justify-between gap-4 text-left">
					<h2
						id="customization-title"
						class="text-4xl leading-tight font-thin text-[color:var(--ui-text)]"
					>
						{title}
					</h2>
					<button
						type="button"
						class="ui-button ui-button-icon cursor-pointer"
						onclick={onclose}
						aria-label="Закрыть"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<div
					class="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto text-sm text-[color:var(--ui-muted)]"
					style="scrollbar-gutter: stable;"
				>
					<div>
						<label for="anim-mode" class="ui-label">Анимация</label>
						<select
							id="anim-mode"
							class="ui-select w-full cursor-pointer px-4 py-2.5 text-base font-normal focus:outline-none"
							bind:value={$animationMode}
						>
							<option value="metro">Metro</option>
							<option value="fade">Fade</option>
							<option value="none">Без анимации</option>
						</select>
					</div>

					<div>
						<label for="color-scheme" class="ui-label">Цветовая схема</label>
						<select
							id="color-scheme"
							class="ui-select w-full cursor-pointer px-4 py-2.5 text-base font-normal focus:outline-none"
							bind:value={$colorScheme}
						>
							{#each colorSchemes as scheme (scheme.id)}
								<option value={scheme.id}>{scheme.label}</option>
							{/each}
						</select>
					</div>

					<hr class="border-[color:var(--ui-border)]" />

					<div>
						<span class="ui-label">Плитки на главном экране</span>
						<div class="flex flex-col gap-2">
							{#each tileGroups as group (group.key)}
								<div class="flex flex-col gap-1">
									<ToggleCard
										value={$tileVisibility[group.key]}
										ontoggle={() => ($tileVisibility[group.key] = !$tileVisibility[group.key])}
										label={group.label}
										desc={group.desc}
										chevron
										chevronOpen={expandedGroups[group.key]}
										onchevronclick={() => toggleGroup(group.key)}
									/>

									{#if expandedGroups[group.key]}
										{#each group.children as child (child.key)}
											<ToggleCard
												value={$tileVisibility[child.key]}
												ontoggle={() => ($tileVisibility[child.key] = !$tileVisibility[child.key])}
												label={child.label}
												desc={child.desc}
												small
												indented
											/>
										{/each}
									{/if}
								</div>
							{/each}

							{#each standaloneTiles as tile (tile.key)}
								<ToggleCard
									value={$tileVisibility[tile.key]}
									ontoggle={() => ($tileVisibility[tile.key] = !$tileVisibility[tile.key])}
									label={tile.label}
									desc={tile.desc}
								/>
							{/each}
						</div>
					</div>
				</div>

				<div class="mt-4 flex shrink-0 items-center justify-end gap-2">
					<button
						type="button"
						class="ui-button flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-normal"
						onclick={resetDefaults}
					>
						<RotateCcw class="h-3.5 w-3.5" />
						<span>Сбросить</span>
					</button>
					<button
						type="button"
						class="ui-button flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-normal"
						onclick={onclose}
					>
						<X class="h-3.5 w-3.5" />
						<span>Закрыть</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
