<script lang="ts">
	import { enhance } from '$app/forms';
	import { X, UserPlus, Loader2 } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { showToast } from '$lib/stores/toast';
	import FormField from '$lib/components/ui/FormField.svelte';

	let {
		open,
		onclose = () => {}
	}: {
		open: boolean;
		onclose?: () => void;
	} = $props();

	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let role = $state<'admin' | 'user'>('user');
	let loading = $state(false);

	$effect(() => {
		if (open) {
			username = '';
			password = '';
			confirmPassword = '';
			role = 'user';
			loading = false;
		}
	});

	function handleClose() {
		username = '';
		password = '';
		confirmPassword = '';
		loading = false;
		onclose();
	}
</script>

{#if open}
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
			aria-labelledby="usercreate-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="mx-auto flex w-full max-w-md flex-col px-4 py-5 sm:px-6">
				<div class="flex w-full shrink-0 items-start justify-between gap-4 text-left">
					<h2
						id="usercreate-title"
						class="text-4xl leading-tight font-thin text-[color:var(--ui-text)]"
					>
						Новый пользователь
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
						action="?/create"
						use:enhance={() => {
							loading = true;
							return async ({ update, result }) => {
								loading = false;
								if (result.type === 'success') {
									await update();
									showToast('Пользователь создан');
									onclose();
									return;
								}
								await update();
							};
						}}
						class="space-y-4"
					>
						<FormField id="create-username" label="Имя пользователя" required>
							<input
								type="text"
								id="create-username"
								name="username"
								bind:value={username}
								placeholder="user_name"
								disabled={loading}
								class="ui-input w-full px-4 py-2.5 text-base font-normal"
								required
							/>
						</FormField>

						<div>
							<label for="create-role" class="ui-label">Роль</label>
							<select
								id="create-role"
								name="role"
								bind:value={role}
								disabled={loading}
								class="ui-input w-full px-4 py-2.5 text-base font-normal"
								required
							>
								<option value="user">Пользователь</option>
								<option value="admin">Администратор</option>
							</select>
						</div>

						<FormField id="create-password" label="Пароль" required>
							<input
								type="password"
								id="create-password"
								name="password"
								bind:value={password}
								placeholder="••••••••"
								disabled={loading}
								class="ui-input w-full px-4 py-2.5 text-sm"
								required
							/>
						</FormField>

						<FormField id="create-confirm" label="Подтвердите пароль" required>
							<input
								type="password"
								id="create-confirm"
								name="confirmPassword"
								bind:value={confirmPassword}
								placeholder="••••••••"
								disabled={loading}
								class="ui-input w-full px-4 py-2.5 text-sm"
								required
							/>
						</FormField>

						<div class="flex items-center justify-end gap-2">
							<button
								type="button"
								class="ui-button flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
								onclick={handleClose}
							>
								<X class="h-4 w-4" />
								<span>Отмена</span>
							</button>
							<button
								type="submit"
								class="ui-button ui-button-primary flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
								disabled={loading}
							>
								{#if loading}
									<Loader2 class="h-4 w-4 animate-spin" />
									<span>Создание...</span>
								{:else}
									<UserPlus class="h-4 w-4" />
									<span>Зарегистрировать</span>
								{/if}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
{/if}
