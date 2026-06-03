import { persistedWritable } from '$lib/stores/persisted';
import type { ColorSchemeId } from '$lib/themes';

export const colorScheme = persistedWritable<ColorSchemeId>('olcgui:colorScheme', 'breeze-dark');
