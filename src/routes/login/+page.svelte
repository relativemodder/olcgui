<script lang="ts">
	import { enhance } from '$app/forms';
	import { LockKeyhole, User, ShieldAlert, Loader2 } from 'lucide-svelte';

	let { form } = $props();

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
</script>

<svelte:head>
	<title>Вход в панель | olcRTC Manager</title>
</svelte:head>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 font-sans"
>
	<div class="w-full max-w-md border border-zinc-800 bg-zinc-900 p-8 shadow-md">
		<div class="mb-8 flex flex-col items-center">
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-950"
			>
				<LockKeyhole class="h-8 w-8 text-zinc-400" />
			</div>
			<h1 class="text-center text-2xl font-bold tracking-tight text-white">olcRTC Manager</h1>
			<p class="mt-1 text-center text-sm font-medium text-zinc-500">
				Авторизуйтесь для управления туннелями
			</p>
		</div>

		{#if form?.error}
			<div
				class="mb-6 flex items-center gap-3 border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-300"
			>
				<ShieldAlert class="h-5 w-5 shrink-0 text-red-400" />
				<span>{form.error}</span>
			</div>
		{/if}

		<form
			action="?/login"
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-5"
		>
			<div>
				<label
					for="username"
					class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
				>
					Имя пользователя
				</label>
				<div class="relative">
					<div
						class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500"
					>
						<User class="h-4 w-4" />
					</div>
					<input
						type="text"
						id="username"
						name="username"
						bind:value={username}
						placeholder="admin"
						disabled={loading}
						class="w-full border border-zinc-800 bg-zinc-950 py-3 pr-4 pl-10 text-sm text-white placeholder-zinc-700 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
						required
					/>
				</div>
			</div>

			<div>
				<label
					for="password"
					class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
				>
					Пароль
				</label>
				<div class="relative">
					<div
						class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500"
					>
						<LockKeyhole class="h-4 w-4" />
					</div>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						placeholder="••••••••"
						disabled={loading}
						class="w-full border border-zinc-800 bg-zinc-950 py-3 pr-4 pl-10 text-sm text-white placeholder-zinc-700 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none"
						required
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-zinc-200"
			>
				{#if loading}
					<Loader2 class="h-5 w-5 animate-spin" />
					<span>Авторизация...</span>
				{:else}
					<span>Войти в систему</span>
				{/if}
			</button>
		</form>
	</div>
</div>
