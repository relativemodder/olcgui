<script lang="ts">
	import { enhance } from '$app/forms';
	import { Users, Trash2 } from 'lucide-svelte';

	let { user, currentUser = null } = $props();
</script>

<div
	class="hover:border-zinc-750 flex items-center justify-between border border-zinc-800 bg-zinc-900 p-5 shadow-md"
>
	<div class="flex items-center gap-3.5">
		<div
			class="flex h-10 w-10 items-center justify-center border border-zinc-800 bg-zinc-950 text-zinc-500"
		>
			<Users class="h-5 w-5" />
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-2">
				<span class="text-sm leading-none font-bold text-white">{user.username}</span>
				{#if currentUser && currentUser.userId === user.id}
					<span
						class="border border-emerald-500/20 bg-emerald-950/40 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400"
					>
						ВЫ
					</span>
				{/if}
			</div>
			<span class="mt-1.5 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">
				{user.role === 'admin' ? 'Администратор' : 'Пользователь'}
			</span>
		</div>
	</div>

	{#if currentUser && currentUser.userId !== user.id}
		<form action="?/delete&id={user.id}" method="POST" use:enhance>
			<button
				type="submit"
				class="border-zinc-750 flex h-9 w-9 cursor-pointer items-center justify-center border bg-zinc-800 text-zinc-400 shadow-sm hover:border-red-600 hover:bg-red-950/50 hover:text-red-400"
				title="Удалить администратора"
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</form>
	{/if}
</div>
