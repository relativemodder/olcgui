import { persistedWritable } from '$lib/stores/persisted';

export type AnimationMode = 'metro' | 'fade' | 'none';

export const animationMode = persistedWritable<AnimationMode>('olcgui:animationMode', 'metro');
