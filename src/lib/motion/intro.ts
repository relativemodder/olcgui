import { get } from 'svelte/store';
import { animationMode, type AnimationMode } from '$lib/stores/animation';
import { metroIntro, type MetroTileParams } from '$lib/motion/metro';
import { fadeIntro, type FadeParams } from '$lib/motion/fade';

export type IntroParams = MetroTileParams & FadeParams;

export function intro(node: Element, params: IntroParams = {}) {
	const mode: AnimationMode = get(animationMode);

	if (mode === 'none') {
		return { destroy() {} };
	}

	if (mode === 'fade') {
		return fadeIntro(node, params);
	}

	return metroIntro(node, params);
}
