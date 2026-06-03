import type { ColorScheme } from './types';

const breezeDark = {
	id: 'breeze-dark',
	label: 'Breeze Dark',
	variables: {
		'--ui-bg': '#232629',
		'--ui-surface': '#31363b',
		'--ui-surface-2': '#3b4045',
		'--ui-surface-strong': '#4b5359',
		'--ui-border': '#4d555c',
		'--ui-border-strong': '#1b1f22',
		'--ui-border-subtle': 'rgba(239, 240, 241, 0.08)',
		'--ui-text': '#eff0f1',
		'--ui-muted': '#bdc3c7',
		'--ui-accent': '#3daee9',
		'--ui-accent-strong': '#1d99f3',
		'--ui-accent-border': '#1688c5',
		'--ui-success': '#27ae60',
		'--ui-success-bg': '#1f3d2f',
		'--ui-success-border': '#2f8e55',
		'--ui-success-text': '#b8f6cf',
		'--ui-warning': '#f67400',
		'--ui-warning-bg': '#3d321f',
		'--ui-warning-border': '#b85d00',
		'--ui-warning-text': '#ffc46b',
		'--ui-danger': '#da4453',
		'--ui-danger-strong': '#8f2f3b',
		'--ui-danger-bg': '#3b252b',
		'--ui-danger-border': '#a83f4a',
		'--ui-danger-text': '#ffb3ba',
		'--ui-code-bg': '#1b1f22',
		'--ui-code-text': '#eff0f1',
		'--ui-hover': '#3b4045',
		'--ui-empty-bg': 'rgba(239, 240, 241, 0.04)',
		'--ui-overlay': 'rgba(10, 10, 10, 0.9)',
		'--ui-glow': 'rgba(239, 240, 241, 0.92)',
		'--ui-glow-muted': 'rgba(189, 195, 199, 0.46)',
		'--ui-glow-dim': 'rgba(189, 195, 199, 0.16)',
		'--ui-selection-text': '#fcfcfc',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default breezeDark;
