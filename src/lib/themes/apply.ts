import type { ColorScheme } from './types';

export function applyTheme(scheme: ColorScheme): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	for (const [key, value] of Object.entries(scheme.variables)) {
		root.style.setProperty(key, value);
	}
}
