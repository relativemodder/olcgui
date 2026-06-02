<script lang="ts">
	let {
		status = 'stopped' as 'running' | 'restarting' | 'error' | 'stopped' | 'active'
	}: {
		status?: 'running' | 'restarting' | 'error' | 'stopped' | 'active';
	} = $props();

	const config = {
		running: 'bg-[color:var(--ui-accent)]',
		restarting: 'bg-[color:var(--ui-muted)] animate-pulse',
		error: 'bg-[color:var(--ui-danger)]',
		stopped: 'bg-[color:var(--ui-border-strong)]',
		active: 'bg-[color:var(--ui-accent)]'
	} as const;

	const labels = {
		running: 'Активен',
		restarting: 'Перезапуск',
		error: 'Ошибка',
		stopped: 'Остановлен',
		active: 'Активна'
	} as const;
</script>

<div class="h-3 w-3 shrink-0 rounded-full {config[status]}" title={labels[status]}></div>
