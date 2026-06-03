<script lang="ts">
	let { active = false }: { active?: boolean } = $props();
</script>

{#if active}
	<div class="dot-progress">
		{#each [0, 1, 2, 3, 4, 5] as _, i (i)}
			<div class="dot" style="animation-delay: {i * 0.5}s;"></div>
		{/each}
	</div>
{/if}

<style>
	.dot-progress {
		position: fixed;
		top: 64px;
		left: 0;
		right: 0;
		z-index: 40;
		height: 0;
		pointer-events: none;
	}

	.dot {
		position: absolute;
		left: 0;
		top: 5px;
		width: 4px;
		height: 4px;
		background: var(--ui-text);
		animation: dot-run 3s linear infinite;
		animation-fill-mode: both;
	}

	@keyframes dot-run {
		0% {
			transform: translateX(-12px) scale(0.25);
			animation-timing-function: cubic-bezier(0, 0.7, 0.5, 0.85);
		}
		10% {
			transform: translateX(28vw) scale(1);
			animation-timing-function: cubic-bezier(0, 0, 0.3, 1);
		}
		80% {
			transform: translateX(calc(28vw + 80px)) scale(1);
			animation-timing-function: ease-in;
		}
		92% {
			transform: translateX(calc(100vw + 12px)) scale(0.25);
		}
		100% {
			transform: translateX(calc(100vw + 12px)) scale(0.25);
		}
	}
</style>
