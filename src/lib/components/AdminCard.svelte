<script lang="ts">
	import { Users, Trash2, Pencil } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { intro } from '$lib/motion/intro';

	let {
		user,
		currentUser = null,
		onedit = (_user: { id: number; username: string; role: string }) => {},
		ondelete = async (_id: number) => {}
	}: {
		user: { id: number; username: string; role: string };
		currentUser?: { userId: number; username: string; role: string } | null;
		onedit?: (user: { id: number; username: string; role: string }) => void;
		ondelete?: (id: number) => Promise<void> | void;
	} = $props();
</script>

<div use:intro class="ui-panel ui-metro-surface flex items-center justify-between p-5">
	<div class="flex items-center gap-3.5">
		<div
			class="flex h-10 w-10 items-center justify-center border border-[color:var(--ui-border-strong)] bg-[color:var(--ui-surface-2)] text-[color:var(--ui-muted)]"
		>
			<Users class="h-5 w-5" />
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-2">
				<span class="text-base leading-none font-medium">{user.username}</span>
				{#if currentUser && currentUser.userId === user.id}
					<Badge variant="emerald">ВЫ</Badge>
				{/if}
			</div>
			<span class="mt-1.5 text-xs font-medium tracking-wide text-[color:var(--ui-muted)] uppercase">
				{user.role === 'admin' ? 'Администратор' : 'Пользователь'}
			</span>
		</div>
	</div>

	{#if currentUser && currentUser.role === 'admin' && currentUser.userId !== user.id}
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				class="ui-button ui-button-icon cursor-pointer"
				title="Сменить пароль"
				onclick={() => onedit(user)}
			>
				<Pencil class="h-4 w-4" />
			</button>
			<button
				type="button"
				class="ui-button ui-button-icon ui-button-danger cursor-pointer"
				title="Удалить"
				onclick={() => ondelete(user.id)}
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</div>
	{/if}
</div>
