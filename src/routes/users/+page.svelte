<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, UserPlus, Loader2 } from 'lucide-svelte';
	import { AdminCard, FormField, Panel, ErrorAlert, Button, PageHeader } from '$lib';

	let { data, form } = $props();

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
</script>

<svelte:head>
	<title>Доступ и пользователи | olcRTC Manager</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader title="Доступ в панель" description="Управление администраторами и сессиями" />

	<ErrorAlert message={form?.error ?? ''} />

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<Panel title="Список администраторов ({data.adminUsers.length})" icon={Users}>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each data.adminUsers as user (user.id)}
						<AdminCard {user} currentUser={data.currentUser} />
					{/each}
				</div>
			</Panel>
		</div>

		<Panel title="Новый администратор" icon={UserPlus}>
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
				<FormField id="username" label="Имя пользователя" required>
					<input
						type="text"
						id="username"
						name="username"
						bind:value={username}
						placeholder="admin_sec"
						disabled={loading}
						class="ui-input w-full px-4 py-2.5 text-base font-normal"
						required
					/>
				</FormField>

				<FormField id="password" label="Пароль" required>
					<input
						type="password"
						id="password"
						name="password"
						bind:value={password}
						placeholder="••••••••"
						disabled={loading}
						class="ui-input w-full px-4 py-2.5 text-sm"
						required
					/>
				</FormField>

				<FormField id="confirmPassword" label="Подтвердите пароль" required>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						bind:value={confirmPassword}
						placeholder="••••••••"
						disabled={loading}
						class="ui-input w-full px-4 py-2.5 text-sm"
						required
					/>
				</FormField>

				<Button
					type="submit"
					variant="primary"
					{loading}
					class="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
				>
					{#if loading}
						<Loader2 class="h-5 w-5 animate-spin" />
						<span>Создание...</span>
					{:else}
						<UserPlus class="h-4 w-4" />
						<span>Зарегистрировать</span>
					{/if}
				</Button>
			</form>
		</Panel>
	</div>
</div>
