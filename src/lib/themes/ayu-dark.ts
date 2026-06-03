import type { ColorScheme } from './types';

const ayuDark = {
	id: 'ayu-dark',
	label: 'Ayu Dark',
	variables: {
		'--ui-bg': '#0a0e14',
		'--ui-surface': '#131721',
		'--ui-surface-2': '#1a1f2a',
		'--ui-surface-strong': '#242b38',
		'--ui-border': '#242b38',
		'--ui-border-strong': '#060a0f',
		'--ui-border-subtle': 'rgba(179, 177, 173, 0.08)',
		'--ui-text': '#b3b1ad',
		'--ui-muted': '#757a7e',
		'--ui-accent': '#59c2ff',
		'--ui-accent-strong': '#39bae6',
		'--ui-accent-border': '#59c2ff',
		'--ui-success': '#aad94c',
		'--ui-success-bg': 'rgba(170, 217, 76, 0.12)',
		'--ui-success-border': '#aad94c',
		'--ui-success-text': '#aad94c',
		'--ui-warning': '#ffd173',
		'--ui-warning-bg': 'rgba(255, 209, 115, 0.12)',
		'--ui-warning-border': '#ffd173',
		'--ui-warning-text': '#ffd173',
		'--ui-danger': '#f07178',
		'--ui-danger-strong': '#ff8f40',
		'--ui-danger-bg': 'rgba(240, 113, 120, 0.12)',
		'--ui-danger-border': '#f07178',
		'--ui-danger-text': '#f07178',
		'--ui-code-bg': '#060a0f',
		'--ui-code-text': '#b3b1ad',
		'--ui-hover': '#181d28',
		'--ui-empty-bg': 'rgba(179, 177, 173, 0.04)',
		'--ui-overlay': 'rgba(6, 10, 15, 0.9)',
		'--ui-glow': 'rgba(179, 177, 173, 0.92)',
		'--ui-glow-muted': 'rgba(117, 122, 126, 0.46)',
		'--ui-glow-dim': 'rgba(117, 122, 126, 0.16)',
		'--ui-selection-text': '#0a0e14',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default ayuDark;
