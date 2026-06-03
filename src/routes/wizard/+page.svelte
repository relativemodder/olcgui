<script lang="ts">
	import { enhance } from '$app/forms';
	import WizardImportPanel from '$lib/components/wizard/WizardImportPanel.svelte';
	import WizardExportPanel from '$lib/components/wizard/WizardExportPanel.svelte';
	import WizardJitsiDirectory from '$lib/components/wizard/WizardJitsiDirectory.svelte';
	import { PROVIDER_CONFIG } from '$lib/wizard/constants';
	import {
		generateCryptoKey,
		parseRoomUrl,
		generateYaml,
		generateOlcrtcUri,
		replaceJitsiServer,
		type ParsedOlcrtcUri
	} from '$lib/wizard/utils';
	import { Sliders, RefreshCw, Info } from 'lucide-svelte';
	import { FormField, SelectField, Panel, ErrorAlert, PageHeader, Button, intro } from '$lib';

	let { form, data } = $props();

	/* svelte-ignore state_referenced_locally */
	const initial = $state.snapshot(data.editInstance);

	let name = $state(initial?.name ?? '');
	let mode = $state<'cnc' | 'srv'>(initial?.mode ?? 'srv');
	let provider = $state<'jitsi' | 'wbstream' | 'telemost'>(initial?.provider ?? 'jitsi');
	let roomUrl = $state(initial?.roomUrl ?? '');
	let cryptoKey = $state(initial?.cryptoKey ?? generateCryptoKey());
	let transport = $state<'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel'>(
		(initial?.transport as 'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel') ??
			'datachannel'
	);
	let dns = $state(initial?.dns ?? '8.8.8.8:53');
	let socksHost = $state(initial?.socksHost ?? '127.0.0.1');
	let socksPort = $state(initial?.socksPort ?? 8808);
	let socksUser = $state(initial?.socksUser ?? '');
	let socksPass = $state(initial?.socksPass ?? '');
	let debug = $state(initial?.debug ?? false);

	function handleRegenKey() {
		cryptoKey = generateCryptoKey();
	}

	/* svelte-ignore state_referenced_locally */
	let lastProvider = provider;

	$effect(() => {
		if (provider !== lastProvider) {
			lastProvider = provider;
			const config = PROVIDER_CONFIG[provider];

			transport = config.transport as typeof transport;
			socksPort = config.socksPort;

			const isOtherProvider = Object.keys(PROVIDER_CONFIG)
				.filter((p) => p !== provider)
				.some((p) => {
					const otherUrl = PROVIDER_CONFIG[p as keyof typeof PROVIDER_CONFIG].defaultRoomUrl;
					try {
						const hostname = new URL(otherUrl).hostname;
						return roomUrl.includes(hostname) || (p === 'telemost' && roomUrl.includes('telemost'));
					} catch {
						return false;
					}
				});

			if (isOtherProvider) {
				roomUrl = config.defaultRoomUrl;
			}
		}
	});

	let parsedRoomId = $derived(parseRoomUrl(roomUrl, provider));

	let liveYaml = $derived(
		generateYaml(
			{
				provider,
				roomUrl,
				cryptoKey,
				transport,
				dns,
				socksHost,
				socksPort,
				socksUser,
				socksPass,
				debug
			},
			mode
		)
	);

	let liveClientRunCommand = $derived.by(() => {
		return `./build/olcrtc-linux-amd64 client.yaml`;
	});

	let liveShareUrl = $derived(generateOlcrtcUri(provider, transport, roomUrl, cryptoKey, name));

	function handleImportData(data: ParsedOlcrtcUri & { resolvedUrl: string }) {
		provider = data.provider;
		lastProvider = data.provider;
		transport = data.transport;
		cryptoKey = data.cryptoKey;
		name = data.name;
		roomUrl = data.resolvedUrl;
	}
</script>

<svelte:head>
	<title>{data.editInstance ? 'Редактирование' : 'Мастер настройки'} | olcRTC Manager</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader
		title={data.editInstance ? 'Редактирование туннеля' : 'Мастер настройки туннеля'}
		description={data.editInstance
			? `Изменение параметров и копирование ссылки обмена для туннеля "${data.editInstance.name}"`
			: 'Настройте параметры и сохраните туннель'}
	/>

	<ErrorAlert message={form?.error ?? ''} />

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
		<div class="space-y-6">
			<WizardImportPanel onImport={handleImportData} />

			<Panel title="Параметры инстанса" icon={Sliders}>
				<form method="POST" action="?/save" use:enhance class="space-y-5">
					{#if data.editInstance}
						<input type="hidden" name="id" value={data.editInstance.id} />
					{/if}
					<input type="hidden" name="socksHost" value={socksHost} />
					<input type="hidden" name="dns" value={dns} />
					<input type="hidden" name="debug" value={debug ? 'true' : 'false'} />

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<FormField id="name" label="Название туннеля" required>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={name}
								class="ui-input w-full px-4 py-2.5 text-base font-normal"
								required
							/>
						</FormField>

						<SelectField id="mode" label="Режим работы" bind:value={mode} required>
							<option value="cnc">Клиент</option>
							<option value="srv">Сервер</option>
						</SelectField>
					</div>

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<SelectField id="provider" label="Сервис-провайдер" bind:value={provider} required>
							<option value="jitsi">Инстанс Jitsi Meet</option>
							<option value="wbstream">WB Stream</option>
							<option value="telemost">Яндекс.Телемост</option>
						</SelectField>

						<SelectField
							id="transport"
							label="Канал данных (Транспорт)"
							bind:value={transport}
							required
						>
							{#if provider === 'jitsi'}
								<option value="datachannel">datachannel (Рекомендуется)</option>
								<option value="vp8channel">vp8channel</option>
							{:else if provider === 'wbstream'}
								<option value="vp8channel">vp8channel (Рекомендуется)</option>
								<option value="seichannel">seichannel</option>
							{:else}
								<option value="videochannel">videochannel (Рекомендуется)</option>
								<option value="vp8channel">vp8channel</option>
							{/if}
						</SelectField>
					</div>

					<div>
						<label
							for="roomUrl"
							class="mb-2 flex items-center justify-between text-sm font-medium tracking-wide text-[color:var(--ui-muted)] uppercase"
						>
							<span>Ссылка на комнату (конференцию) *</span>
							{#if parsedRoomId && parsedRoomId !== roomUrl}
								<span
									class="border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] px-2 py-0.5 font-mono text-xs font-normal tracking-wide text-[color:var(--ui-muted)] uppercase"
								>
									ID: {parsedRoomId}
								</span>
							{/if}
						</label>
						<input
							type="url"
							id="roomUrl"
							name="roomUrl"
							bind:value={roomUrl}
							placeholder="Вставьте ссылку на конференцию"
							class="ui-input w-full px-4 py-2.5 text-sm"
							required
						/>

						{#if provider === 'jitsi'}
							<WizardJitsiDirectory
								onSelect={(server) => {
									roomUrl = replaceJitsiServer(roomUrl, server);
								}}
							/>
						{/if}
					</div>

					<div>
						<label
							for="cryptoKey"
							class="mb-2 block text-sm font-medium tracking-wide text-[color:var(--ui-muted)] uppercase"
						>
							Ключ шифрования (32 байта Hex) *
						</label>
						<div class="relative">
							<input
								type="text"
								id="cryptoKey"
								name="cryptoKey"
								bind:value={cryptoKey}
								placeholder="Ключ должен совпадать на клиенте и сервере"
								class="ui-input w-full py-2.5 pr-12 pl-4 font-mono text-[11px]"
								required
							/>
							<button
								type="button"
								onclick={handleRegenKey}
								class="absolute inset-y-0 right-0 flex cursor-pointer items-center justify-center px-3 text-[color:var(--ui-muted)] hover:text-[color:var(--ui-text)]"
								title="Сгенерировать случайный ключ"
							>
								<RefreshCw class="h-4 w-4" />
							</button>
						</div>
					</div>

					{#if mode === 'cnc'}
						<div
							use:intro={{ rotation: 58, x: -16, z: -30 }}
							class="ui-metro-surface space-y-4 border border-[color:var(--ui-border)] bg-[color:var(--ui-surface-2)] p-4"
						>
							<h3
								class="flex items-center gap-1.5 text-xl font-thin tracking-wide text-[color:var(--ui-text)] uppercase"
							>
								<Info class="h-3.5 w-3.5" />
								<span>Настройки SOCKS5 прокси</span>
							</h3>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField id="socksPort" label="SOCKS5 Порт" required class="">
									<input
										type="number"
										id="socksPort"
										name="socksPort"
										bind:value={socksPort}
										min="1"
										max="65535"
										class="ui-input w-full px-3 py-2 text-sm font-normal"
										required
									/>
								</FormField>

								<div class="flex items-center gap-2 pt-6">
									<input
										type="checkbox"
										id="debugCheck"
										bind:checked={debug}
										class="h-4 w-4 cursor-pointer border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)] accent-[color:var(--ui-accent)]"
									/>
									<label
										for="debugCheck"
										class="cursor-pointer text-sm font-normal text-[color:var(--ui-muted)] select-none"
									>
										Включить отладку (debug)
									</label>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormField id="socksUser" label="Логин авторизации (необязательно)" class="">
									<input
										type="text"
										id="socksUser"
										name="socksUser"
										bind:value={socksUser}
										placeholder="Пользователь прокси"
										class="ui-input w-full px-3 py-2 text-xs"
									/>
								</FormField>

								<FormField id="socksPass" label="Пароль авторизации (необязательно)" class="">
									<input
										type="text"
										id="socksPass"
										name="socksPass"
										bind:value={socksPass}
										placeholder="Пароль прокси"
										class="ui-input w-full px-3 py-2 text-xs"
									/>
								</FormField>
							</div>
						</div>
					{/if}

					<Button
						type="submit"
						variant="primary"
						class="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
					>
						<Sliders class="h-5 w-5" />
						<span>{data.editInstance ? 'Сохранить изменения' : 'Создать туннель'}</span>
					</Button>
				</form>
			</Panel>
		</div>

		<WizardExportPanel {liveShareUrl} {liveYaml} {liveClientRunCommand} {mode} />
	</div>
</div>
