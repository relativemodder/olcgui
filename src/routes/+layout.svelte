<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { LayoutDashboard, Sliders, Cpu, Users, LogOut, Terminal } from 'lucide-svelte';

	let { data, children } = $props();

	// Active route helper
	let currentPath = $derived(page.url.pathname);
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="relative flex min-h-screen flex-col bg-zinc-950 font-sans text-slate-100 antialiased">
	{#if data.user}
		<header
			class="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900 shadow-md shadow-black/10"
		>
			<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 items-center justify-center border border-zinc-600 bg-zinc-600 shadow-sm"
					>
						<Terminal class="h-5 w-5 text-white" />
					</div>
					<div class="flex flex-col">
						<span class="text-sm leading-none font-extrabold tracking-tight text-white"
							>olcRTC GUI</span
						>
					</div>
				</div>

				<nav
					class="hidden items-center gap-1 border border-zinc-800 bg-zinc-950 p-1 md:flex"
				>
					<a
						href="/"
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium {currentPath ===
						'/'
							? 'bg-white text-black'
							: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
					>
						<LayoutDashboard class="h-4 w-4" />
						<span>Панель</span>
					</a>
					<a
						href="/wizard"
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium {currentPath ===
						'/wizard'
							? 'bg-white text-black'
							: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
					>
						<Sliders class="h-4 w-4" />
						<span>Мастер</span>
					</a>
					<a
						href="/builds"
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium {currentPath ===
						'/builds'
							? 'bg-white text-black'
							: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
					>
						<Cpu class="h-4 w-4" />
						<span>Сборки</span>
					</a>
					<a
						href="/users"
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium {currentPath ===
						'/users'
							? 'bg-white text-black'
							: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
					>
						<Users class="h-4 w-4" />
						<span>Доступ</span>
					</a>
				</nav>

				<div class="flex items-center gap-4">
					<div class="hidden flex-col items-end text-right sm:flex">
						<span class="text-xs font-semibold text-white">{data.user.username}</span>
					</div>
					<form action="/login?/logout" method="POST" use:enhance>
						<button
							type="submit"
							title="Выйти из системы"
							class="flex h-9 w-9 cursor-pointer items-center justify-center border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-sm hover:border-red-600 hover:bg-red-950/50 hover:text-red-400"
						>
							<LogOut class="h-4 w-4" />
						</button>
					</form>
				</div>
			</div>
		</header>

		<nav
			class="shadow-2xl shadow-black border-t border-zinc-800 fixed bottom-0 z-40 flex w-full items-center justify-around bg-zinc-900 px-2 py-2 md:hidden"
		>
			<a
				href="/"
				class="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold {currentPath ===
				'/'
					? 'font-bold text-white'
					: 'text-zinc-400'}"
			>
				<LayoutDashboard class="h-4 w-4" />
				<span>Панель</span>
			</a>
			<a
				href="/wizard"
				class="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold {currentPath ===
				'/wizard'
					? 'font-bold text-white'
					: 'text-zinc-400'}"
			>
				<Sliders class="h-4 w-4" />
				<span>Мастер</span>
			</a>
			<a
				href="/builds"
				class="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold {currentPath ===
				'/builds'
					? 'font-bold text-white'
					: 'text-zinc-400'}"
			>
				<Cpu class="h-4 w-4" />
				<span>Сборки</span>
			</a>
			<a
				href="/users"
				class="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold {currentPath ===
				'/users'
					? 'font-bold text-white'
					: 'text-zinc-400'}"
			>
				<Users class="h-4 w-4" />
				<span>Доступ</span>
			</a>
		</nav>
	{/if}

	<main class="flex w-full flex-grow flex-col">
		{@render children()}
	</main>

	<div class="mb-10 md:hidden"></div>
</div>
