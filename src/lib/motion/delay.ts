export const delayCache = new Map<Element, Element[]>();
export let delayCacheResetScheduled = false;

export function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export function getAutoDelay(node: Element, stagger: number, maxDelay: number) {
	if (typeof document === 'undefined') return 0;

	const scope = node.closest('[data-metro-stagger-scope]') ?? document.body;
	let surfaces = delayCache.get(scope);

	if (!surfaces) {
		surfaces = Array.from(scope.querySelectorAll('.ui-metro-surface'));
		delayCache.set(scope, surfaces);
	}

	if (!delayCacheResetScheduled && typeof requestAnimationFrame !== 'undefined') {
		delayCacheResetScheduled = true;
		requestAnimationFrame(() => {
			delayCache.clear();
			delayCacheResetScheduled = false;
		});
	}

	const index = Math.max(0, surfaces.indexOf(node));

	return Math.min(index * stagger, maxDelay);
}

export function resetDelayCache() {
	delayCache.clear();
	delayCacheResetScheduled = false;
}
