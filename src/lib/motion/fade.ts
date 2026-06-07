import { getAutoDelay, prefersReducedMotion } from './delay';

export type FadeParams = {
	delay?: number | 'auto';
	duration?: number;
	y?: number;
	stagger?: number;
	maxDelay?: number;
};

export function fadeIntro(node: Element, params: FadeParams = {}) {
	let frame = 0;
	let animation: Animation | undefined;

	function play() {
		if (prefersReducedMotion()) return;

		const duration = params.duration ?? 400;
		const stagger = params.stagger ?? 48;
		const maxDelay = params.maxDelay ?? 280;
		const delay = params.delay ?? 'auto';
		const y = params.y ?? 10;
		const resolvedDelay = delay === 'auto' ? getAutoDelay(node, stagger, maxDelay) : delay;

		animation?.cancel();
		animation = node.animate(
			[
				{
					opacity: 0,
					transform: `translateY(${y}px)`
				},
				{
					opacity: 1,
					transform: 'translateY(0)'
				}
			],
			{
				delay: resolvedDelay,
				duration,
				easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
				fill: 'backwards'
			}
		);
	}

	frame = requestAnimationFrame(play);

	return {
		destroy() {
			cancelAnimationFrame(frame);
			animation?.cancel();
		}
	};
}
