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
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { LayoutDashboard, Sliders, Cpu, Users, LogOut, Terminal } from 'lucide-svelte';
	import NavItem from '$lib/components/ui/NavItem.svelte';
	import MetroAlertHost from '$lib/components/ui/MetroAlertHost.svelte';
	import PressFeedback from '$lib/components/ui/PressFeedback.svelte';
	import RevealBorder from '$lib/components/ui/RevealBorder.svelte';

	let { data, children } = $props();

	let currentPath = $derived(page.url.pathname);

	const navLinks = [
		{ href: '/', icon: LayoutDashboard, label: 'Панель' },
		{ href: '/wizard', icon: Sliders, label: 'Мастер' },
		{ href: '/builds', icon: Cpu, label: 'Сборки' },
		{ href: '/users', icon: Users, label: 'Доступ' }
	];
</script>

<svelte:head></svelte:head>

<div class="ui-app-shell relative flex min-h-screen flex-col">
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
						<span class="text-xl leading-none font-thin">olcRTC GUI</span>
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
					<form action="/login?/logout" method="POST" use:enhance>
						<button
							type="submit"
							title="Выйти из системы"
							class="ui-button ui-button-icon text-[color:var(--ui-muted)] hover:text-[color:var(--ui-danger)]"
						>
							<LogOut class="h-4 w-4" />
						</button>
					</form>
				</div>
			</div>
		</header>

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
	<PressFeedback />
	<RevealBorder />
</div>
