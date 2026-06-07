import { writable } from 'svelte/store';
import type { AnimationMode } from './animation';

export const appReady = writable(false);
export const appShellVisible = writable(false);
export const appAnimationMode = writable<AnimationMode>('metro');
