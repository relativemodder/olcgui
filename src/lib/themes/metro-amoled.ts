import type { ColorScheme } from './types';

const metroAmoled = {
	id: 'metro-amoled',
	label: 'Metro AMOLED',
	variables: {
		'--ui-bg': '#000000',
		'--ui-surface': '#0a0a0a',
		'--ui-surface-2': '#121212',
		'--ui-surface-strong': '#1a1a1a',
		'--ui-border': '#2a2a2a',
		'--ui-border-strong': '#1a1a1a',
		'--ui-border-subtle': 'rgba(255, 255, 255, 0.06)',
		'--ui-text': '#ffffff',
		'--ui-muted': '#aaaaaa',
		'--ui-accent': '#00bfff',
		'--ui-accent-strong': '#0099cc',
		'--ui-accent-border': '#007799',
		'--ui-success': '#00cc66',
		'--ui-success-bg': '#00361a',
		'--ui-success-border': '#00883a',
		'--ui-success-text': '#66ff99',
		'--ui-warning': '#ff8800',
		'--ui-warning-bg': '#3d2100',
		'--ui-warning-border': '#bb6600',
		'--ui-warning-text': '#ffbb66',
		'--ui-danger': '#ff3355',
		'--ui-danger-strong': '#991133',
		'--ui-danger-bg': '#3d0000',
		'--ui-danger-border': '#bb0022',
		'--ui-danger-text': '#ff8899',
		'--ui-code-bg': '#0a0a0a',
		'--ui-code-text': '#ffffff',
		'--ui-hover': '#121212',
		'--ui-empty-bg': 'rgba(255, 255, 255, 0.04)',
		'--ui-overlay': 'rgba(0, 0, 0, 0.95)',
		'--ui-glow': 'rgba(255, 255, 255, 0.88)',
		'--ui-glow-muted': 'rgba(170, 170, 170, 0.40)',
		'--ui-glow-dim': 'rgba(170, 170, 170, 0.14)',
		'--ui-selection-text': '#ffffff',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default metroAmoled;
