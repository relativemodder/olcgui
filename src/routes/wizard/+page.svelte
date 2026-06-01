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
	import {
		Sliders,
		RefreshCw,
		Info,
		ShieldAlert
	} from 'lucide-svelte';

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
	<div class="mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">
			{data.editInstance ? 'Редактирование туннеля' : 'Мастер настройки туннеля'}
		</h1>
		<p class="mt-1 text-sm text-zinc-500">
			{#if data.editInstance}
				Изменение параметров и копирование ссылки обмена для туннеля "{data.editInstance.name}"
			{:else}
				Создайте, экспортируйте конфигурацию и мгновенно сохраните как active туннель в системе
			{/if}
		</p>
	</div>

	{#if form?.error}
		<div
			class="mb-6 flex items-center gap-3 border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300"
		>
			<ShieldAlert class="h-5 w-5 shrink-0 text-red-400" />
			<span>{form.error}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
		<div class="space-y-6">
			<WizardImportPanel onImport={handleImportData} />

			<div class="border border-zinc-800 bg-zinc-900 p-6 shadow-md">
				<h2 class="mb-6 flex items-center gap-2 text-lg font-bold text-white">
					<Sliders class="h-5 w-5 text-zinc-500" />
					<span>Параметры инстанса</span>
				</h2>

				<form method="POST" action="?/save" use:enhance class="space-y-5">
					{#if data.editInstance}
						<input type="hidden" name="id" value={data.editInstance.id} />
					{/if}
					<input type="hidden" name="socksHost" value={socksHost} />
					<input type="hidden" name="dns" value={dns} />
					<input type="hidden" name="debug" value={debug ? 'true' : 'false'} />

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div>
							<label
								for="name"
								class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
							>
								Название туннеля *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								bind:value={name}
								class="w-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-zinc-500 focus:outline-none"
								required
							/>
						</div>

						<div>
							<label
								for="mode"
								class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
							>
								Режим работы *
							</label>
							<select
								id="mode"
								name="mode"
								bind:value={mode}
								class="w-full cursor-pointer border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-zinc-500 focus:outline-none"
							>
								<option value="cnc" class="bg-zinc-950 text-white">Клиент</option>
								<option value="srv" class="bg-zinc-950 text-white">Сервер</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div>
							<label
								for="provider"
								class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
							>
								Сервис-провайдер *
							</label>
							<select
								id="provider"
								name="provider"
								bind:value={provider}
								class="w-full cursor-pointer border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-zinc-500 focus:outline-none"
							>
								<option value="jitsi" class="bg-zinc-950 text-white">Инстанс Jitsi Meet</option>
								<option value="wbstream" class="bg-zinc-950 text-white">WB Stream</option>
								<option value="telemost" class="bg-zinc-950 text-white">Яндекс.Телемост</option>
							</select>
						</div>

						<div>
							<label
								for="transport"
								class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
							>
								Канал данных (Транспорт) *
							</label>
							<select
								id="transport"
								name="transport"
								bind:value={transport}
								class="w-full cursor-pointer border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-zinc-500 focus:outline-none"
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
							</select>
						</div>
					</div>

					<div>
						<label
							for="roomUrl"
							class="mb-2 flex items-center justify-between text-xs font-semibold tracking-wider text-zinc-400 uppercase"
						>
							<span>Ссылка на комнату (конференцию) *</span>
							{#if parsedRoomId && parsedRoomId !== roomUrl}
								<span
									class="border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
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
							class="w-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
							required
						/>

						{#if provider === 'jitsi'}
							<WizardJitsiDirectory onSelect={(server) => { roomUrl = replaceJitsiServer(roomUrl, server); }} />
						{/if}
					</div>

					<div>
						<label
							for="cryptoKey"
							class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
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
								class="w-full border border-zinc-800 bg-zinc-950 py-2.5 pr-12 pl-4 font-mono text-[11px] text-white focus:border-zinc-500 focus:outline-none"
								required
							/>
							<button
								type="button"
								onclick={handleRegenKey}
								class="absolute inset-y-0 right-0 flex cursor-pointer items-center justify-center px-3 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
								title="Сгенерировать случайный ключ"
							>
								<RefreshCw class="h-4 w-4" />
							</button>
						</div>
					</div>

					{#if mode === 'cnc'}
						<div class="space-y-4 border border-zinc-800 bg-zinc-950 p-4">
							<h3
								class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-zinc-300 uppercase"
							>
								<Info class="h-3.5 w-3.5" />
								<span>Настройки SOCKS5 прокси</span>
							</h3>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label
										for="socksPort"
										class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
									>
										SOCKS5 Порт *
									</label>
									<input
										type="number"
										id="socksPort"
										name="socksPort"
										bind:value={socksPort}
										min="1"
										max="65535"
										class="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white focus:border-zinc-500 focus:outline-none"
										required
									/>
								</div>

								<div class="flex items-center gap-2 pt-6">
									<input
										type="checkbox"
										id="debugCheck"
										bind:checked={debug}
										class="h-4 w-4 cursor-pointer border-zinc-800 bg-zinc-950 accent-zinc-500"
									/>
									<label
										for="debugCheck"
										class="cursor-pointer text-xs font-semibold text-zinc-400 select-none"
									>
										Включить отладку (debug)
									</label>
								</div>
							</div>

							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label
										for="socksUser"
										class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
									>
										Логин авторизации (необязательно)
									</label>
									<input
										type="text"
										id="socksUser"
										name="socksUser"
										bind:value={socksUser}
										placeholder="Пользователь прокси"
										class="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-zinc-500 focus:outline-none"
									/>
								</div>

								<div>
									<label
										for="socksPass"
										class="mb-1.5 block text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
									>
										Пароль авторизации (необязательно)
									</label>
									<input
										type="text"
										id="socksPass"
										name="socksPass"
										bind:value={socksPass}
										placeholder="Пароль прокси"
										class="w-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-zinc-500 focus:outline-none"
									/>
								</div>
							</div>
						</div>
					{/if}

					<button
						type="submit"
						class="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200"
					>
						<Sliders class="h-5 w-5" />
						<span
							>{data.editInstance ? 'Сохранить изменения' : 'Сохранить в панель управления'}</span
						>
					</button>
				</form>
			</div>
		</div>

		<WizardExportPanel
			{liveShareUrl}
			{liveYaml}
			{liveClientRunCommand}
			{mode}
		/>
	</div>
</div>
