import { get } from 'svelte/store';
import { appAnimationMode, appReady } from '$lib/stores/bootstrap';
import { metroIntro, type MetroTileParams } from '$lib/motion/metro';
import { fadeIntro, type FadeParams } from '$lib/motion/fade';

export type IntroParams = MetroTileParams & FadeParams;

export function intro(node: Element, params: IntroParams = {}) {
	const start = () => {
		const mode = get(appAnimationMode);

		if (mode === 'none') {
			return { destroy() {} };
		}

		if (mode === 'fade') {
			return fadeIntro(node, params);
		}

		return metroIntro(node, params);
	};

	let cleanup = { destroy() {} };
	let unsubscribe: () => void = () => {};
	unsubscribe = appReady.subscribe((value) => {
		if (value) {
			cleanup = start();
			queueMicrotask(() => unsubscribe());
		}
	});

	return {
		destroy() {
			unsubscribe();
			cleanup.destroy();
		}
	};
}
