import type { ColorScheme } from './types';

const catppuccinLatte = {
	id: 'catppuccin-latte',
	label: 'Catppuccin Latte',
	variables: {
		'--ui-bg': '#eff1f5',
		'--ui-surface': '#ccd0da',
		'--ui-surface-2': '#bcc0cc',
		'--ui-surface-strong': '#acb0be',
		'--ui-border': '#bcc0cc',
		'--ui-border-strong': '#acb0be',
		'--ui-border-subtle': 'rgba(76, 79, 105, 0.10)',
		'--ui-text': '#4c4f69',
		'--ui-muted': '#7c7f93',
		'--ui-accent': '#1e66f5',
		'--ui-accent-strong': '#209fb5',
		'--ui-accent-border': '#1e66f5',
		'--ui-success': '#40a02b',
		'--ui-success-bg': 'rgba(64, 160, 43, 0.10)',
		'--ui-success-border': '#40a02b',
		'--ui-success-text': '#40a02b',
		'--ui-warning': '#df8e1d',
		'--ui-warning-bg': 'rgba(223, 142, 29, 0.10)',
		'--ui-warning-border': '#df8e1d',
		'--ui-warning-text': '#df8e1d',
		'--ui-danger': '#d20f39',
		'--ui-danger-strong': '#e64553',
		'--ui-danger-bg': 'rgba(210, 15, 57, 0.10)',
		'--ui-danger-border': '#d20f39',
		'--ui-danger-text': '#d20f39',
		'--ui-code-bg': '#e6e9ef',
		'--ui-code-text': '#4c4f69',
		'--ui-hover': '#c4c8d4',
		'--ui-empty-bg': 'rgba(76, 79, 105, 0.04)',
		'--ui-overlay': 'rgba(220, 224, 232, 0.9)',
		'--ui-glow': 'rgba(76, 79, 105, 0.92)',
		'--ui-glow-muted': 'rgba(124, 127, 147, 0.46)',
		'--ui-glow-dim': 'rgba(124, 127, 147, 0.16)',
		'--ui-selection-text': '#eff1f5',
		'color-scheme': 'light'
	}
} as const satisfies ColorScheme;

export default catppuccinLatte;
