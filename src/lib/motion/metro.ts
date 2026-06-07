import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { getAutoDelay, prefersReducedMotion } from './delay';

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

const DEFAULT_DURATION = 520;
const DEFAULT_ROTATION_DEG = 78;
const DEFAULT_X_OFFSET_PX = -22;
const DEFAULT_Z_OFFSET_PX = -42;
const DEFAULT_SCALE = 0.985;
const DEFAULT_PERSPECTIVE_PX = 900;
const DEFAULT_STAGGER_MS = 48;
const DEFAULT_MAX_DELAY_MS = 280;

const DURATION_MOBILE_MULTIPLIER = 0.58;
const DURATION_DESKTOP_MULTIPLIER = 0.88;
const STAGGER_MOBILE_MULTIPLIER = 0.42;
const STAGGER_DESKTOP_MULTIPLIER = 0.84;
const MAX_DELAY_MOBILE_MULTIPLIER = 0.45;
const MAX_DELAY_DESKTOP_MULTIPLIER = 0.82;

const MOBILE_MIN_DURATION = 180;
const DESKTOP_MIN_DURATION = 220;
const MOBILE_MIN_STAGGER = 12;
const MOBILE_MIN_MAX_DELAY = 120;

function prefersMobileMotion() {
	return typeof window !== 'undefined' && window.matchMedia(mobileMotionQuery).matches;
}

function resolveMetroMotion(params: MetroTileParams) {
	const mobile = prefersMobileMotion();
	const duration = params.duration ?? DEFAULT_DURATION;
	const stagger = params.stagger ?? DEFAULT_STAGGER_MS;
	const maxDelay = params.maxDelay ?? DEFAULT_MAX_DELAY_MS;

	return {
		delay: params.delay ?? 'auto',
		duration: mobile
			? Math.max(MOBILE_MIN_DURATION, Math.round(duration * DURATION_MOBILE_MULTIPLIER))
			: Math.max(DESKTOP_MIN_DURATION, Math.round(duration * DURATION_DESKTOP_MULTIPLIER)),
		rotation: params.rotation ?? DEFAULT_ROTATION_DEG,
		x: params.x ?? DEFAULT_X_OFFSET_PX,
		y: params.y ?? 0,
		z: params.z ?? DEFAULT_Z_OFFSET_PX,
		opacity: params.opacity ?? 0,
		scale: params.scale ?? DEFAULT_SCALE,
		perspective: params.perspective ?? DEFAULT_PERSPECTIVE_PX,
		stagger: mobile
			? Math.max(MOBILE_MIN_STAGGER, Math.round(stagger * STAGGER_MOBILE_MULTIPLIER))
			: Math.round(stagger * STAGGER_DESKTOP_MULTIPLIER),
		maxDelay: mobile
			? Math.min(MOBILE_MIN_MAX_DELAY, Math.round(maxDelay * MAX_DELAY_MOBILE_MULTIPLIER))
			: Math.round(maxDelay * MAX_DELAY_DESKTOP_MULTIPLIER)
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
