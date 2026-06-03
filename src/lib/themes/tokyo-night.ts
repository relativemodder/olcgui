import type { ColorScheme } from './types';

const tokyoNight = {
	id: 'tokyo-night',
	label: 'Tokyo Night',
	variables: {
		'--ui-bg': '#1a1b26',
		'--ui-surface': '#24283b',
		'--ui-surface-2': '#2f3346',
		'--ui-surface-strong': '#3b3f58',
		'--ui-border': '#2f3346',
		'--ui-border-strong': '#15161e',
		'--ui-border-subtle': 'rgba(192, 202, 245, 0.08)',
		'--ui-text': '#c0caf5',
		'--ui-muted': '#7982a9',
		'--ui-accent': '#7aa2f7',
		'--ui-accent-strong': '#89ddff',
		'--ui-accent-border': '#7aa2f7',
		'--ui-success': '#9ece6a',
		'--ui-success-bg': 'rgba(158, 206, 106, 0.12)',
		'--ui-success-border': '#9ece6a',
		'--ui-success-text': '#9ece6a',
		'--ui-warning': '#e0af68',
		'--ui-warning-bg': 'rgba(224, 175, 104, 0.12)',
		'--ui-warning-border': '#e0af68',
		'--ui-warning-text': '#e0af68',
		'--ui-danger': '#f7768e',
		'--ui-danger-strong': '#db4b4b',
		'--ui-danger-bg': 'rgba(247, 118, 142, 0.12)',
		'--ui-danger-border': '#f7768e',
		'--ui-danger-text': '#f7768e',
		'--ui-code-bg': '#15161e',
		'--ui-code-text': '#c0caf5',
		'--ui-hover': '#2a2e42',
		'--ui-empty-bg': 'rgba(192, 202, 245, 0.04)',
		'--ui-overlay': 'rgba(21, 22, 30, 0.9)',
		'--ui-glow': 'rgba(192, 202, 245, 0.92)',
		'--ui-glow-muted': 'rgba(121, 130, 169, 0.46)',
		'--ui-glow-dim': 'rgba(121, 130, 169, 0.16)',
		'--ui-selection-text': '#1a1b26',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default tokyoNight;
