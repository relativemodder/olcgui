import type { ColorScheme } from './types';

const solarizedLight = {
	id: 'solarized-light',
	label: 'Solarized Light',
	variables: {
		'--ui-bg': '#fdf6e3',
		'--ui-surface': '#eee8d5',
		'--ui-surface-2': '#e0dbc8',
		'--ui-surface-strong': '#d3cfba',
		'--ui-border': '#d3cfba',
		'--ui-border-strong': '#bdc3a9',
		'--ui-border-subtle': 'rgba(101, 123, 131, 0.10)',
		'--ui-text': '#657b83',
		'--ui-muted': '#839496',
		'--ui-accent': '#268bd2',
		'--ui-accent-strong': '#2aa198',
		'--ui-accent-border': '#268bd2',
		'--ui-success': '#859900',
		'--ui-success-bg': 'rgba(133, 153, 0, 0.10)',
		'--ui-success-border': '#859900',
		'--ui-success-text': '#859900',
		'--ui-warning': '#b58900',
		'--ui-warning-bg': 'rgba(181, 137, 0, 0.10)',
		'--ui-warning-border': '#b58900',
		'--ui-warning-text': '#b58900',
		'--ui-danger': '#dc322f',
		'--ui-danger-strong': '#cb4b16',
		'--ui-danger-bg': 'rgba(220, 50, 47, 0.10)',
		'--ui-danger-border': '#dc322f',
		'--ui-danger-text': '#dc322f',
		'--ui-code-bg': '#eee8d5',
		'--ui-code-text': '#657b83',
		'--ui-hover': '#e8e2d0',
		'--ui-empty-bg': 'rgba(101, 123, 131, 0.04)',
		'--ui-overlay': 'rgba(211, 207, 186, 0.9)',
		'--ui-glow': 'rgba(101, 123, 131, 0.92)',
		'--ui-glow-muted': 'rgba(131, 148, 150, 0.46)',
		'--ui-glow-dim': 'rgba(131, 148, 150, 0.16)',
		'--ui-selection-text': '#fdf6e3',
		'color-scheme': 'light'
	}
} as const satisfies ColorScheme;

export default solarizedLight;
