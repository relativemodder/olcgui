<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, Trash2 } from 'lucide-svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { metroIntro } from '$lib/motion/metro';

	let { user, currentUser = null } = $props();
</script>

<div use:metroIntro class="ui-panel ui-metro-surface flex items-center justify-between p-5">
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
			<span
				class="mt-1.5 text-xs font-medium tracking-wide text-[color:var(--ui-muted)] uppercase"
			>
				{user.role === 'admin' ? 'Администратор' : 'Пользователь'}
			</span>
		</div>
	</div>

	{#if currentUser && currentUser.userId !== user.id}
		<form action="?/delete&id={user.id}" method="POST" use:enhance>
			<button
				type="submit"
				class="ui-button ui-button-icon ui-button-danger cursor-pointer"
				title="Удалить администратора"
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</form>
	{/if}
</div>
