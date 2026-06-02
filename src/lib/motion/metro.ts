import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export type MetroTileParams = {
	delay?: number | 'auto';
	duration?: number;
	rotation?: number;
	x?: number;
	y?: number;
	z?: number;
	opacity?: number;
	scale?: number;
	perspective?: number;
	stagger?: number;
	maxDelay?: number;
};

export const metroMotionEnabled = true;

const mobileMotionQuery = '(max-width: 767px), (pointer: coarse)';
const desktopMotionSpeed = 0.88;
const delayCache = new Map<Element, Element[]>();
let delayCacheResetScheduled = false;

function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

function prefersMobileMotion() {
	return typeof window !== 'undefined' && window.matchMedia(mobileMotionQuery).matches;
}

function getAutoDelay(node: Element, stagger: number, maxDelay: number) {
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

function resolveMetroMotion(params: MetroTileParams) {
	const mobile = prefersMobileMotion();
	const duration = params.duration ?? 520;
	const stagger = params.stagger ?? 48;
	const maxDelay = params.maxDelay ?? 280;

	return {
		delay: params.delay ?? 'auto',
		duration: mobile
			? Math.max(180, Math.round(duration * 0.58))
			: Math.max(220, Math.round(duration * desktopMotionSpeed)),
		rotation: params.rotation ?? 78,
		x: params.x ?? -22,
		y: params.y ?? 0,
		z: params.z ?? -42,
		opacity: params.opacity ?? 0,
		scale: params.scale ?? 0.985,
		perspective: params.perspective ?? 900,
		stagger: mobile ? Math.max(12, Math.round(stagger * 0.42)) : Math.round(stagger * 0.84),
		maxDelay: mobile ? Math.min(120, Math.round(maxDelay * 0.45)) : Math.round(maxDelay * 0.82)
	};
}

export function metroTile(node: Element, params: MetroTileParams = {}): TransitionConfig {
	if (!metroMotionEnabled || prefersReducedMotion()) {
		return {
			delay: 0,
			duration: 1,
			css: () => 'opacity: 1; transform: none;'
		};
	}

	const computed = getComputedStyle(node);
	const baseTransform = computed.transform === 'none' ? '' : `${computed.transform} `;
	const { delay, duration, rotation, x, y, z, opacity, scale, perspective, stagger, maxDelay } =
		resolveMetroMotion(params);
	const resolvedDelay = delay === 'auto' ? getAutoDelay(node, stagger, maxDelay) : delay;

	return {
		delay: resolvedDelay,
		duration,
		easing: cubicOut,
		css: (t, u) => `
			opacity: ${opacity + (1 - opacity) * t};
			transform-origin: left center;
			transform-style: preserve-3d;
			backface-visibility: hidden;
			transform: perspective(${perspective}px)
				translate3d(${x * u}px, ${y * u}px, ${z * u}px)
				rotateY(${rotation * u}deg)
				scale(${scale + (1 - scale) * t})
				${baseTransform};
		`
	};
}

export function metroIntro(node: Element, params: MetroTileParams = {}) {
	let frame = 0;
	let animation: Animation | undefined;

	function play() {
		if (!metroMotionEnabled || prefersReducedMotion()) return;

		const computed = getComputedStyle(node);
		const baseTransform = computed.transform === 'none' ? '' : `${computed.transform} `;
		const { delay, duration, rotation, x, y, z, opacity, scale, perspective, stagger, maxDelay } =
			resolveMetroMotion(params);
		const resolvedDelay = delay === 'auto' ? getAutoDelay(node, stagger, maxDelay) : delay;

		animation?.cancel();
		animation = node.animate(
			[
				{
					opacity,
					transformOrigin: 'left center',
					transformStyle: 'preserve-3d',
					backfaceVisibility: 'hidden',
					transform: `perspective(${perspective}px) translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotation}deg) scale(${scale}) ${baseTransform}`
				},
				{
					opacity: 1,
					transformOrigin: 'left center',
					transformStyle: 'preserve-3d',
					backfaceVisibility: 'hidden',
					transform: `perspective(${perspective}px) translate3d(0, 0, 0) rotateY(0deg) scale(1) ${baseTransform}`
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
