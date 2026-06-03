import type { ColorScheme } from './types';

const gruvboxDark = {
	id: 'gruvbox-dark',
	label: 'Gruvbox Dark',
	variables: {
		'--ui-bg': '#282828',
		'--ui-surface': '#3c3836',
		'--ui-surface-2': '#504945',
		'--ui-surface-strong': '#665c54',
		'--ui-border': '#504945',
		'--ui-border-strong': '#1d2021',
		'--ui-border-subtle': 'rgba(235, 219, 178, 0.08)',
		'--ui-text': '#ebdbb2',
		'--ui-muted': '#a89984',
		'--ui-accent': '#83a598',
		'--ui-accent-strong': '#8ec07c',
		'--ui-accent-border': '#83a598',
		'--ui-success': '#b8bb26',
		'--ui-success-bg': 'rgba(184, 187, 38, 0.12)',
		'--ui-success-border': '#b8bb26',
		'--ui-success-text': '#b8bb26',
		'--ui-warning': '#fabd2f',
		'--ui-warning-bg': 'rgba(250, 189, 47, 0.12)',
		'--ui-warning-border': '#fabd2f',
		'--ui-warning-text': '#fabd2f',
		'--ui-danger': '#fb4934',
		'--ui-danger-strong': '#cc241d',
		'--ui-danger-bg': 'rgba(251, 73, 52, 0.12)',
		'--ui-danger-border': '#fb4934',
		'--ui-danger-text': '#fb4934',
		'--ui-code-bg': '#1d2021',
		'--ui-code-text': '#ebdbb2',
		'--ui-hover': '#45403d',
		'--ui-empty-bg': 'rgba(235, 219, 178, 0.04)',
		'--ui-overlay': 'rgba(29, 32, 33, 0.9)',
		'--ui-glow': 'rgba(235, 219, 178, 0.92)',
		'--ui-glow-muted': 'rgba(168, 153, 132, 0.46)',
		'--ui-glow-dim': 'rgba(168, 153, 132, 0.16)',
		'--ui-selection-text': '#282828',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default gruvboxDark;
