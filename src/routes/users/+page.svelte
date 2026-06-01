<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, UserPlus, ShieldAlert, Loader2 } from 'lucide-svelte';
	import AdminCard from '$lib/components/AdminCard.svelte';

	let { data, form } = $props();

	// Form states
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
</script>

<svelte:head>
	<title>Доступ и пользователи | olcRTC Manager</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<h1 class="text-3xl font-extrabold tracking-tight text-white">Доступ в панель</h1>
		<p class="mt-1 text-sm font-medium text-zinc-500">
			Управление администраторами, разграничение сессий и настройка прав безопасности
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

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<h2
				class="mb-2 flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase"
			>
				<Users class="h-4.5 w-4.5 text-zinc-500" />
				<span>Список администраторов ({data.adminUsers.length})</span>
			</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each data.adminUsers as user (user.id)}
					<AdminCard {user} currentUser={data.currentUser} />
				{/each}
			</div>
		</div>

		<div class="border border-zinc-800 bg-zinc-900 p-6 shadow-md">
			<h2
				class="mb-6 flex items-center gap-2 text-sm font-bold tracking-wider text-white uppercase"
			>
				<UserPlus class="h-5 w-5 text-zinc-500" />
				<span>Новый администратор</span>
			</h2>

			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						username = '';
						password = '';
						confirmPassword = '';
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label
						for="username"
						class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>
						Имя пользователя *
					</label>
					<input
						type="text"
						id="username"
						name="username"
						bind:value={username}
						placeholder="admin_sec"
						disabled={loading}
						class="w-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-zinc-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<label
						for="password"
						class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>
						Пароль *
					</label>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						placeholder="••••••••"
						disabled={loading}
						class="w-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
						required
					/>
				</div>

				<div>
					<label
						for="confirmPassword"
						class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
					>
						Подтвердите пароль *
					</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						bind:value={confirmPassword}
						placeholder="••••••••"
						disabled={loading}
						class="w-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white focus:border-zinc-500 focus:outline-none"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-300"
				>
					{#if loading}
						<Loader2 class="h-5 w-5 animate-spin" />
						<span>Создание...</span>
					{:else}
						<UserPlus class="h-4 w-4" />
						<span>Зарегистрировать</span>
					{/if}
				</button>
			</form>
		</div>
	</div>
</div>
