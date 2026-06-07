<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ShieldCheck, Loader2 } from 'lucide-svelte';
	import { FormField, ErrorAlert, Button, intro } from '$lib';
	import { api, setAuthToken, ApiError } from '$lib/api';

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;
		loading = true;
		error = '';
		try {
			const result = await api.auth.setupCreate({ username, password, confirmPassword });
			setAuthToken(result.token);
			await invalidateAll();
			await goto('/');
		} catch (e) {
			error = e instanceof ApiError ? e.message : 'Ошибка настройки. Попробуйте ещё раз.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Первоначальная настройка | olcRTC Manager</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center px-4">
	<div use:intro class="ui-panel ui-metro-surface w-full max-w-md p-8">
		<div class="mb-8 flex flex-col items-center">
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)]"
			>
				<ShieldCheck class="h-8 w-8 text-[color:var(--ui-muted)]" />
			</div>
			<h1 class="text-4xl font-thin">olcRTC Manager</h1>
			<p class="mt-1 text-center text-base font-normal text-[color:var(--ui-muted)]">
				Создайте первоначальную учетную запись администратора
			</p>
		</div>

		<ErrorAlert message={error} />

		<form method="POST" onsubmit={handleSubmit} class="space-y-5">
			<FormField id="username" label="Имя администратора" required>
				<input
					type="text"
					id="username"
					name="username"
					bind:value={username}
					placeholder="например, admin"
					disabled={loading}
					class="ui-input w-full px-4 py-3 text-sm"
					required
				/>
			</FormField>

			<FormField id="password" label="Пароль" required>
				<input
					type="password"
					id="password"
					name="password"
					bind:value={password}
					placeholder="Не менее 6 символов"
					disabled={loading}
					class="ui-input w-full px-4 py-3 text-sm"
					required
				/>
			</FormField>

			<FormField id="confirmPassword" label="Подтверждение пароля" required>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					bind:value={confirmPassword}
					placeholder="Повторите введенный пароль"
					disabled={loading}
					class="ui-input w-full px-4 py-3 text-sm"
					required
				/>
			</FormField>

			<Button
				type="submit"
				variant="primary"
				{loading}
				class="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
			>
				{#if loading}
					<Loader2 class="h-5 w-5 animate-spin" />
					<span>Сохранение...</span>
				{:else}
					<span>Завершить настройку</span>
				{/if}
			</Button>
		</form>
	</div>
</div>
