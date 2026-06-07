<script lang="ts">
	import '@fontsource/noto-sans/latin-100.css';
	import '@fontsource/noto-sans/latin-300.css';
	import '@fontsource/noto-sans/latin-400.css';
	import '@fontsource/noto-sans/latin-500.css';
	import '@fontsource/noto-sans/cyrillic-100.css';
	import '@fontsource/noto-sans/cyrillic-300.css';
	import '@fontsource/noto-sans/cyrillic-400.css';
	import '@fontsource/noto-sans/cyrillic-500.css';
	import './layout.css';
	import { beforeNavigate, afterNavigate, goto, invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount, setContext } from 'svelte';
	import { LayoutDashboard, Sliders, Cpu, Users, LogOut, Terminal } from 'lucide-svelte';
	import {
		AppBootstrapOverlay,
		DotProgress,
		NavItem,
		MetroAlertHost,
		PressFeedback,
		RevealBorder
	} from '$lib';
	import Toast from '$lib/components/ui/Toast.svelte';
	import {
		APP_SETTINGS_CONTEXT,
		createAppSettingsStores,
		DEFAULT_APP_SETTINGS
	} from '$lib/stores/appSettings';
	import { appAnimationMode, appReady, appShellVisible } from '$lib/stores/bootstrap';
	import { getColorScheme } from '$lib/themes';
	import { apiFetch, clearAuthToken } from '$lib/api';

	let { data, children } = $props();

	let navigating = $state(false);
	function getInitialSettings() {
		return data.settings ?? DEFAULT_APP_SETTINGS;
	}
	const settings = createAppSettingsStores(getInitialSettings());
	const { colorScheme, animationMode } = settings;
	setContext(APP_SETTINGS_CONTEXT, settings);

	onMount(() => {
		let secondFrame = 0;
		const firstFrame = requestAnimationFrame(() => {
			appReady.set(true);
			secondFrame = requestAnimationFrame(() => {
				appShellVisible.set(true);
			});
		});

		return () => {
			cancelAnimationFrame(firstFrame);
			cancelAnimationFrame(secondFrame);
			appReady.set(false);
			appShellVisible.set(false);
		};
	});

	beforeNavigate(() => {
		navigating = true;
	});

	afterNavigate(() => {
		navigating = false;
	});

	let currentTheme = $derived(getColorScheme($colorScheme));
	let themeHref = $derived(`${base}${currentTheme.href}`);

	let currentPath = $derived(page.url.pathname);

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = currentTheme.id;
		}
		appAnimationMode.set($animationMode);
	});

	let navLinks = $derived([
		{ href: '/', icon: LayoutDashboard, label: 'Панель' },
		{ href: '/wizard', icon: Sliders, label: 'Мастер' },
		{ href: '/builds', icon: Cpu, label: 'Сборки' },
		{ href: '/users', icon: Users, label: 'Доступ' }
	]);

	async function logout() {
		await apiFetch('/api/auth/logout', { method: 'POST' });
		clearAuthToken();
		await invalidateAll();
		await goto('/login');
	}
</script>

<svelte:head>
	<link rel="stylesheet" href={themeHref} />
</svelte:head>

<AppBootstrapOverlay visible={!$appShellVisible} />

<div
	class:opacity-0={!$appShellVisible}
	class:invisible={!$appShellVisible}
	class="ui-app-shell relative flex min-h-screen flex-col transition-opacity duration-150"
>
	{#if data.user}
		<header class="ui-header sticky top-0 z-50 w-full">
			<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 items-center justify-center border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)] text-[color:var(--ui-text)]"
					>
						<Terminal class="h-5 w-5" />
					</div>
					<div class="flex flex-col">
						<span class="text-xl leading-none font-light">olcRTC GUI</span>
					</div>
				</div>

				<nav class="ui-nav hidden items-stretch md:flex">
					{#each navLinks as link (link.href)}
						<NavItem href={link.href} {currentPath} icon={link.icon} label={link.label} />
					{/each}
				</nav>

				<div class="flex items-center gap-4">
					<div class="hidden flex-col items-end text-right sm:flex">
						<span class="text-sm font-normal">{data.user.username}</span>
					</div>
					<button
						type="button"
						title="Выйти из системы"
						class="ui-button ui-button-icon text-[color:var(--ui-muted)] hover:text-[color:var(--ui-danger)]"
						onclick={logout}
					>
						<LogOut class="h-4 w-4" />
					</button>
				</div>
			</div>
		</header>

		<DotProgress active={navigating} />

		<nav
			class="fixed bottom-0 z-40 flex w-full items-center justify-around border-t border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface)] px-2 py-2 md:hidden"
		>
			{#each navLinks as link (link.href)}
				<NavItem
					href={link.href}
					{currentPath}
					icon={link.icon}
					label={link.label}
					variant="mobile"
				/>
			{/each}
		</nav>
	{/if}

	<main data-metro-stagger-scope class="flex w-full flex-grow flex-col">
		{@render children()}
	</main>

	<div class="mb-10 md:hidden"></div>
	<MetroAlertHost />
	<Toast />
	<PressFeedback />
	<RevealBorder />
</div>
