<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Users, UserPlus, KeyRound, UserCog } from 'lucide-svelte';
	import {
		AdminCard,
		FormField,
		Panel,
		ErrorAlert,
		Button,
		PageHeader,
		UserEditModal,
		UserCreateModal
	} from '$lib';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { apiFetch, readApiError } from '$lib/api';
	import { showToast } from '$lib/stores/toast';

	let { data } = $props();

	let creatingUser = $state(false);

	let selfUsername = $state('');
	let selfPrevUsername = $state('');

	$effect(() => {
		const name = data.currentUser?.username ?? '';
		if (name !== selfPrevUsername) {
			selfUsername = name;
			selfPrevUsername = name;
		}
	});
	let selfCurrentPassword = $state('');
	let selfNewPassword = $state('');
	let selfConfirmNewPassword = $state('');
	let selfPasswordLoading = $state(false);
	let selfUsernameLoading = $state(false);

	let editingUser = $state<{ id: number; username: string; role: string } | null>(null);

	let isAdmin = $derived(data.currentUser?.role === 'admin');

	async function updateSelf(event: SubmitEvent) {
		event.preventDefault();
		if (selfUsernameLoading) return;
		selfUsernameLoading = true;
		const res = await apiFetch('/api/users/self', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username: selfUsername, currentPassword: selfCurrentPassword })
		});
		selfUsernameLoading = false;
		if (!res.ok) {
			showToast(await readApiError(res, 'Не удалось обновить имя пользователя.'));
			return;
		}
		selfCurrentPassword = '';
		showToast('Имя пользователя обновлено');
		await invalidateAll();
	}

	async function updateSelfPassword(event: SubmitEvent) {
		event.preventDefault();
		if (selfPasswordLoading) return;
		selfPasswordLoading = true;
		const res = await apiFetch('/api/users/self-password', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				currentPassword: selfCurrentPassword,
				newPassword: selfNewPassword,
				confirmPassword: selfConfirmNewPassword
			})
		});
		selfPasswordLoading = false;
		if (!res.ok) {
			showToast(await readApiError(res, 'Не удалось изменить пароль.'));
			return;
		}
		selfCurrentPassword = '';
		selfNewPassword = '';
		selfConfirmNewPassword = '';
		showToast('Пароль изменён');
	}

	async function deleteUser(id: number) {
		const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
		if (!res.ok) {
			showToast(await readApiError(res, 'Не удалось удалить пользователя.'));
			return;
		}
		showToast('Пользователь удалён');
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Доступ и пользователи | olcRTC Manager</title>
</svelte:head>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<PageHeader title="Доступ в панель" description="Управление пользователями и сессиями" />

	<ErrorAlert message="" />

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
		{#if isAdmin}
			<div class="order-2 space-y-4 lg:order-none lg:col-span-2">
				<Panel title="Список пользователей ({data.allUsers.length})" icon={Users}>
					{#snippet actions()}
						<button
							type="button"
							onclick={() => (creatingUser = true)}
							class="ui-button ui-button-icon cursor-pointer"
							title="Новый пользователь"
						>
							<UserPlus class="h-4 w-4" />
						</button>
					{/snippet}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each data.allUsers as user (user.id)}
							<AdminCard
								{user}
								currentUser={data.currentUser}
								onedit={(u) => (editingUser = u)}
								ondelete={deleteUser}
							/>
						{/each}
					</div>
				</Panel>
			</div>
		{/if}
		<div class="space-y-4 {isAdmin ? '' : 'lg:col-span-3'} {isAdmin ? 'order-1 lg:order-3' : ''}">
			<Panel title="Мой аккаунт" icon={UserCog}>
				{#if data.currentUser}
					<div class="mb-4 flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)] text-[color:var(--ui-muted)]"
						>
							<Users class="h-5 w-5" />
						</div>
						<div class="flex flex-col">
							<div class="flex items-center gap-2">
								<span class="text-base leading-none font-medium">{data.currentUser.username}</span>
								<Badge variant="emerald">ВЫ</Badge>
							</div>
							<span
								class="mt-1.5 text-xs font-medium tracking-wide text-[color:var(--ui-muted)] uppercase"
							>
								{data.currentUser.role === 'admin' ? 'Администратор' : 'Пользователь'}
							</span>
						</div>
					</div>

					<form method="POST" onsubmit={updateSelf} class="space-y-3">
						<FormField id="selfUsername" label="Имя пользователя" required>
							<input
								type="text"
								id="selfUsername"
								name="username"
								bind:value={selfUsername}
								disabled={selfUsernameLoading}
								class="ui-input w-full px-4 py-2.5 text-base font-normal"
								required
							/>
						</FormField>

						<FormField id="selfCurrentPassword" label="Текущий пароль (для подтверждения)" required>
							<input
								type="password"
								id="selfCurrentPassword"
								name="currentPassword"
								bind:value={selfCurrentPassword}
								placeholder="••••••••"
								disabled={selfUsernameLoading}
								class="ui-input w-full px-4 py-2.5 text-sm"
								required
							/>
						</FormField>

						<Button
							type="submit"
							variant="secondary"
							loading={selfUsernameLoading}
							class="flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
						>
							<Users class="h-4 w-4" />
							<span>Сохранить имя</span>
						</Button>
					</form>

					<hr class="my-4 border-[color:var(--ui-border-subtle)]" />

					<form method="POST" onsubmit={updateSelfPassword} class="space-y-3">
						<FormField id="currentPassword" label="Текущий пароль" required>
							<input
								type="password"
								id="currentPassword"
								name="currentPassword"
								bind:value={selfCurrentPassword}
								placeholder="••••••••"
								disabled={selfPasswordLoading}
								class="ui-input w-full px-4 py-2.5 text-sm"
								required
							/>
						</FormField>

						<FormField id="newPassword" label="Новый пароль" required>
							<input
								type="password"
								id="newPassword"
								name="newPassword"
								bind:value={selfNewPassword}
								placeholder="••••••••"
								disabled={selfPasswordLoading}
								class="ui-input w-full px-4 py-2.5 text-sm"
								required
							/>
						</FormField>

						<FormField id="confirmNewPassword" label="Подтвердите пароль" required>
							<input
								type="password"
								id="confirmNewPassword"
								name="confirmPassword"
								bind:value={selfConfirmNewPassword}
								placeholder="••••••••"
								disabled={selfPasswordLoading}
								class="ui-input w-full px-4 py-2.5 text-sm"
								required
							/>
						</FormField>

						<Button
							type="submit"
							variant="primary"
							loading={selfPasswordLoading}
							class="flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-3"
						>
							<KeyRound class="h-4 w-4" />
							<span>Сменить пароль</span>
						</Button>
					</form>
				{/if}
			</Panel>
		</div>
	</div>
</div>

<UserEditModal
	open={editingUser !== null}
	user={editingUser}
	onclose={() => (editingUser = null)}
	onupdated={invalidateAll}
/>
<UserCreateModal
	open={creatingUser}
	onclose={() => (creatingUser = false)}
	oncreated={invalidateAll}
/>
