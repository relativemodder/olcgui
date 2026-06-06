<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { LockKeyhole, User, Loader2 } from 'lucide-svelte';
	import { FormField, ErrorAlert, Button, intro } from '$lib';
	import { apiFetch, readApiError, setAuthToken } from '$lib/api';
	import type { SetupCreateResponse } from '$shared/api/types';

	let username = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (loading) return;
		loading = true;
		error = '';
		const res = await apiFetch('/api/auth/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		loading = false;
		if (!res.ok) {
			error = await readApiError(res, 'Ошибка входа. Попробуйте ещё раз.');
			return;
		}
		const data = (await res.json()) as SetupCreateResponse;
		setAuthToken(data.token);
		await invalidateAll();
		await goto('/');
	}
</script>

<svelte:head>
	<title>Вход в панель | olcRTC Manager</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center px-4">
	<div use:intro class="ui-panel ui-metro-surface w-full max-w-md p-8">
		<div class="mb-8 flex flex-col items-center">
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)]"
			>
				<LockKeyhole class="h-8 w-8 text-[color:var(--ui-muted)]" />
			</div>
			<h1 class="text-center text-4xl font-thin">olcRTC Manager</h1>
			<p class="mt-1 text-center text-base font-normal text-[color:var(--ui-muted)]">
				Авторизуйтесь для управления туннелями
			</p>
		</div>

		<ErrorAlert message={error} />

		<form method="POST" onsubmit={handleSubmit} class="space-y-5">
			<FormField id="username" label="Имя пользователя" required>
				<div class="relative">
					<div
						class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[color:var(--ui-muted)]"
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
						class="ui-input w-full py-3 pr-4 pl-10 text-sm"
						required
					/>
				</div>
			</FormField>

			<FormField id="password" label="Пароль" required>
				<div class="relative">
					<div
						class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[color:var(--ui-muted)]"
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
						class="ui-input w-full py-3 pr-4 pl-10 text-sm"
						required
					/>
				</div>
			</FormField>

			<Button
				type="submit"
				variant="primary"
				{loading}
				class="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
			>
				{#if loading}
					<Loader2 class="h-5 w-5 animate-spin" />
					<span>Авторизация...</span>
				{:else}
					<span>Войти в систему</span>
				{/if}
			</Button>
		</form>
	</div>
</div>
