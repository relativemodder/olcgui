<script lang="ts">
	import { enhance } from '$app/forms';
	import { X, Check, Loader2 } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { showToast } from '$lib/stores/toast';

	let {
		open,
		user,
		onclose = () => {}
	}: {
		open: boolean;
		user: { id: number; username: string; role: string } | null;
		onclose?: () => void;
	} = $props();

	let editUsername = $state('');
	let editRole = $state<'admin' | 'user'>('user');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);

	$effect(() => {
		if (open && user) {
			editUsername = user.username;
			editRole = user.role as 'admin' | 'user';
		}
	});

	function handleClose() {
		password = '';
		confirmPassword = '';
		loading = false;
		onclose();
	}
</script>

{#if open && user}
	<div
		class="ui-metro-alert-screen"
		role="presentation"
		onclick={handleClose}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
	>
		<div
			transition:fly={{ y: -28, duration: 220 }}
			class="ui-metro-alert-strip ui-metro-alert-info"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			aria-labelledby="useredit-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mx-auto flex w-full max-w-md flex-col px-4 py-5 sm:px-6">
				<div class="flex w-full shrink-0 items-start justify-between gap-4 text-left">
					<h2
						id="useredit-title"
						class="text-4xl leading-tight font-thin text-[color:var(--ui-text)]"
					>
						{user.username}
					</h2>
					<button
						type="button"
						class="ui-button ui-button-icon cursor-pointer"
						onclick={handleClose}
						aria-label="Закрыть"
					>
						<X class="h-4 w-4" />
					</button>
				</div>

				<div class="mt-4 flex flex-col gap-4">
					<form
						method="POST"
						action="?/updateUser&id={user.id}"
						use:enhance={() => {
							loading = true;
							return async ({ update, result }) => {
								loading = false;
								if (result.type === 'success') {
									await update();
									showToast('Пользователь обновлён');
									handleClose();
									return;
								}
								await update();
							};
						}}
						class="space-y-4"
					>
						<input type="hidden" name="id" value={user.id} />

						<div>
							<label for="edit-username-{user.id}" class="ui-label">Имя пользователя</label>
							<input
								type="text"
								id="edit-username-{user.id}"
								name="username"
								bind:value={editUsername}
								class="ui-input w-full px-4 py-2.5 text-base font-normal"
								required
							/>
						</div>

						<div>
							<label for="edit-role-{user.id}" class="ui-label">Роль</label>
							<select
								id="edit-role-{user.id}"
								name="role"
								bind:value={editRole}
								class="ui-input w-full px-4 py-2.5 text-base font-normal"
								required
							>
								<option value="user">Пользователь</option>
								<option value="admin">Администратор</option>
							</select>
						</div>

						<hr class="border-[color:var(--ui-border-subtle)]" />

						<div>
							<label for="edit-pw-{user.id}" class="ui-label">Новый пароль (необязательно)</label>
							<input
								type="password"
								id="edit-pw-{user.id}"
								name="password"
								bind:value={password}
								placeholder="••••••••"
								class="ui-input w-full px-4 py-2.5 text-sm"
							/>
						</div>

						<div>
							<label for="edit-pw-confirm-{user.id}" class="ui-label">Подтвердите пароль</label>
							<input
								type="password"
								id="edit-pw-confirm-{user.id}"
								name="confirmPassword"
								bind:value={confirmPassword}
								placeholder="••••••••"
								class="ui-input w-full px-4 py-2.5 text-sm"
							/>
						</div>

						<div class="flex items-center justify-end gap-2">
							<button
								type="button"
								class="ui-button flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
								onclick={handleClose}
							>
								<X class="h-4 w-4" />
								<span>Закрыть</span>
							</button>
							<button
								type="submit"
								class="ui-button ui-button-primary flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
								disabled={loading}
							>
								{#if loading}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									<Check class="h-4 w-4" />
								{/if}
								<span>Сохранить</span>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
