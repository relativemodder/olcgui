<script lang="ts">
	import { onMount } from 'svelte';

	const pressSelector = [
		'.ui-button',
		'button',
		'a[href]',
		'[role="button"]',
		'[role="link"]',
		'summary',
		'[tabindex]:not([tabindex="-1"])',
		'.ui-card[data-ui-interactive]',
		'.ui-panel[data-ui-interactive]'
	].join(',');

	const excludedSelector =
		'nav, .ui-nav, .ui-header, input, select, textarea, [contenteditable="true"], [data-ui-press-exclude]';
	const desktopPointerQuery = '(hover: hover) and (pointer: fine)';

	onMount(() => {
		const pointerMedia = window.matchMedia(desktopPointerQuery);
		let activeTarget: HTMLElement | null = null;
		let activePointerId: number | null = null;
		let activePressMode: 'desktop' | 'touch' = 'desktop';
		let touchStartX = 0;
		let touchStartY = 0;
		let pressableCleanupTimer = 0;
		const touchCancelDistance = 12;

		function clearPressableCleanupTimer() {
			if (!pressableCleanupTimer) return;

			window.clearTimeout(pressableCleanupTimer);
			pressableCleanupTimer = 0;
		}

		function clearActiveTarget(animateRelease = true) {
			if (!activeTarget) return;

			const releasedTarget = activeTarget;

			releasedTarget.removeAttribute('data-ui-press-active');
			activeTarget = null;
			activePointerId = null;
			clearPressableCleanupTimer();

			if (!animateRelease) {
				releasedTarget.removeAttribute('data-ui-pressable');
				releasedTarget.removeAttribute('data-ui-press-mode');
				return;
			}

			pressableCleanupTimer = window.setTimeout(() => {
				releasedTarget.removeAttribute('data-ui-pressable');
				releasedTarget.removeAttribute('data-ui-press-mode');
				pressableCleanupTimer = 0;
			}, 180);
		}

		function isDisabled(element: HTMLElement) {
			return (
				element.hasAttribute('disabled') ||
				element.getAttribute('aria-disabled') === 'true' ||
				element.closest('[disabled], [aria-disabled="true"]') !== null
			);
		}

		function resolvePressTarget(target: EventTarget | null) {
			if (!(target instanceof Element) || target.closest(excludedSelector)) {
				return null;
			}

			const element = target.closest<HTMLElement>(pressSelector);

			return element && !isDisabled(element) ? element : null;
		}

		function updatePressOrigin(element: HTMLElement, event: PointerEvent) {
			const rect = element.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const halfWidth = Math.max(rect.width / 2, 1);
			const halfHeight = Math.max(rect.height / 2, 1);
			const normalizedX = Math.max(-1, Math.min(1, (x - halfWidth) / halfWidth));
			const normalizedY = Math.max(-1, Math.min(1, (y - halfHeight) / halfHeight));

			element.style.setProperty('--ui-press-x', `${x}px`);
			element.style.setProperty('--ui-press-y', `${y}px`);
			element.style.setProperty('--ui-press-rotate-x', `${normalizedY * -1.15}deg`);
			element.style.setProperty('--ui-press-rotate-y', `${normalizedX * 1.15}deg`);
		}

		function handlePointerDown(event: PointerEvent) {
			if ((event.pointerType === 'mouse' || event.pointerType === 'pen') && event.button !== 0) {
				return;
			}

			const target = resolvePressTarget(event.target);
			if (!target) return;

			clearActiveTarget(false);
			clearPressableCleanupTimer();

			activeTarget = target;
			activePointerId = event.pointerId;
			activePressMode = pointerMedia.matches && event.pointerType !== 'touch' ? 'desktop' : 'touch';
			touchStartX = event.clientX;
			touchStartY = event.clientY;
			activeTarget.setAttribute('data-ui-pressable', 'true');
			activeTarget.setAttribute('data-ui-press-mode', activePressMode);
			activeTarget.setAttribute('data-ui-press-active', 'true');

			if (activePressMode === 'desktop') {
				updatePressOrigin(activeTarget, event);
			} else {
				activeTarget.style.setProperty('--ui-press-x', '50%');
				activeTarget.style.setProperty('--ui-press-y', '50%');
				activeTarget.style.setProperty('--ui-press-rotate-x', '0deg');
				activeTarget.style.setProperty('--ui-press-rotate-y', '0deg');
			}

			if (activePressMode === 'desktop') {
				try {
					activeTarget.setPointerCapture?.(event.pointerId);
				} catch {
					// Pointer capture is best-effort here; the visual state is still cleared globally.
				}
			}
		}

		function handlePointerMove(event: PointerEvent) {
			if (!activeTarget || activePointerId !== event.pointerId) return;

			if (activePressMode === 'touch') {
				const deltaX = event.clientX - touchStartX;
				const deltaY = event.clientY - touchStartY;

				if (Math.hypot(deltaX, deltaY) > touchCancelDistance) {
					clearActiveTarget(false);
				}

				return;
			}

			updatePressOrigin(activeTarget, event);
		}

		function handlePointerEnd(event: PointerEvent) {
			if (activePointerId !== event.pointerId) return;

			try {
				activeTarget?.releasePointerCapture?.(event.pointerId);
			} catch {
				// The browser may release capture itself if the target changed.
			}

			clearActiveTarget();
		}

		function handlePointerMediaChange() {
			if (!pointerMedia.matches) {
				clearActiveTarget();
			}
		}

		function handleWindowBlur() {
			clearActiveTarget(false);
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('pointermove', handlePointerMove, { passive: true });
		document.addEventListener('pointerup', handlePointerEnd);
		document.addEventListener('pointercancel', handlePointerEnd);
		pointerMedia.addEventListener('change', handlePointerMediaChange);
		window.addEventListener('blur', handleWindowBlur);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('pointermove', handlePointerMove);
			document.removeEventListener('pointerup', handlePointerEnd);
			document.removeEventListener('pointercancel', handlePointerEnd);
			pointerMedia.removeEventListener('change', handlePointerMediaChange);
			window.removeEventListener('blur', handleWindowBlur);
			clearPressableCleanupTimer();
			clearActiveTarget(false);
		};
	});
</script>
