<script lang="ts">
	import { onMount } from 'svelte';

	const surfaceSelector = '.ui-panel, .ui-card';
	const desktopPointerQuery = '(hover: hover) and (pointer: fine)';

	onMount(() => {
		const pointerMedia = window.matchMedia(desktopPointerQuery);
		let frame = 0;
		let lastPointer: PointerEvent | null = null;

		function getSurfaces() {
			return Array.from(document.querySelectorAll<HTMLElement>(surfaceSelector));
		}

		function clearSurfaces() {
			for (const surface of getSurfaces()) {
				surface.removeAttribute('data-ui-reveal-active');
			}
		}

		function updateRevealPosition(surface: HTMLElement, event: PointerEvent) {
			const rect = surface.getBoundingClientRect();

			surface.style.setProperty('--ui-reveal-x', `${event.clientX - rect.left}px`);
			surface.style.setProperty('--ui-reveal-y', `${event.clientY - rect.top}px`);
			surface.setAttribute('data-ui-reveal-active', 'true');
		}

		function updateSurfaces() {
			frame = 0;

			if (!lastPointer) return;

			for (const surface of getSurfaces()) {
				updateRevealPosition(surface, lastPointer);
			}
		}

		function handlePointerMove(event: PointerEvent) {
			if (!pointerMedia.matches || event.pointerType === 'touch') {
				clearSurfaces();
				return;
			}

			lastPointer = event;

			if (!frame) {
				frame = requestAnimationFrame(updateSurfaces);
			}
		}

		function handlePointerLeave() {
			lastPointer = null;
			clearSurfaces();
		}

		function handlePointerMediaChange() {
			if (!pointerMedia.matches) {
				clearSurfaces();
			}
		}

		document.addEventListener('pointermove', handlePointerMove, { passive: true });
		document.addEventListener('pointerover', handlePointerMove, { passive: true });
		document.addEventListener('pointerleave', handlePointerLeave);
		pointerMedia.addEventListener('change', handlePointerMediaChange);

		return () => {
			if (frame) {
				cancelAnimationFrame(frame);
			}

			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('pointerover', handlePointerMove);
			document.removeEventListener('pointerleave', handlePointerLeave);
			pointerMedia.removeEventListener('change', handlePointerMediaChange);
			clearSurfaces();
		};
	});
</script>
