<script lang="ts">
	import { enhance } from '$app/forms';
	import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-svelte';

	let { form } = $props();

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
</script>

<svelte:head>
	<title>Первоначальная настройка | olcRTC Manager</title>
</svelte:head>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 font-sans"
>
	<div class="w-full max-w-md border border-zinc-800 bg-zinc-900 p-8 shadow-md">
		<div class="mb-8 flex flex-col items-center">
			<div class="mb-4 flex h-16 w-16 items-center justify-center border border-zinc-800 bg-zinc-950">
				<ShieldCheck class="h-8 w-8 text-zinc-400" />
			</div>
			<h1 class="text-2xl font-bold tracking-tight text-white">olcRTC Manager</h1>
			<p class="mt-1 text-center text-sm font-medium text-zinc-500">
				Создайте первоначальную учетную запись администратора
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
					Имя администратора
				</label>
				<input
					type="text"
					id="username"
					name="username"
					bind:value={username}
					placeholder="например, admin"
					disabled={loading}
					class="w-full border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none"
					required
				/>
			</div>

			<div>
				<label
					for="password"
					class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
				>
					Пароль
				</label>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					placeholder="Не менее 6 символов"
					disabled={loading}
					class="w-full border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none"
					required
				/>
			</div>

			<div>
				<label
					for="confirmPassword"
					class="mb-2 block text-xs font-semibold tracking-wider text-zinc-400 uppercase"
				>
					Подтверждение пароля
				</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					bind:value={confirmPassword}
					placeholder="Повторите введенный пароль"
					disabled={loading}
					class="w-full border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none"
					required
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-semibold text-black shadow-sm hover:bg-white/80"
			>
				{#if loading}
					<Loader2 class="h-5 w-5 animate-spin" />
					<span>Сохранение...</span>
				{:else}
					<span>Завершить настройку</span>
				{/if}
			</button>
		</form>
	</div>
</div>
