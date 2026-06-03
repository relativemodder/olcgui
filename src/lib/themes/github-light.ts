import type { ColorScheme } from './types';

const githubLight = {
	id: 'github-light',
	label: 'GitHub Light',
	variables: {
		'--ui-bg': '#ffffff',
		'--ui-surface': '#f6f8fa',
		'--ui-surface-2': '#eaeef2',
		'--ui-surface-strong': '#d0d7de',
		'--ui-border': '#d0d7de',
		'--ui-border-strong': '#afb8c1',
		'--ui-border-subtle': 'rgba(31, 35, 40, 0.10)',
		'--ui-text': '#1f2328',
		'--ui-muted': '#656d76',
		'--ui-accent': '#0969da',
		'--ui-accent-strong': '#218bff',
		'--ui-accent-border': '#0969da',
		'--ui-success': '#1a7f37',
		'--ui-success-bg': 'rgba(26, 127, 55, 0.10)',
		'--ui-success-border': '#1a7f37',
		'--ui-success-text': '#1a7f37',
		'--ui-warning': '#9a6700',
		'--ui-warning-bg': 'rgba(154, 103, 0, 0.10)',
		'--ui-warning-border': '#9a6700',
		'--ui-warning-text': '#9a6700',
		'--ui-danger': '#cf222e',
		'--ui-danger-strong': '#a40e26',
		'--ui-danger-bg': 'rgba(207, 34, 46, 0.10)',
		'--ui-danger-border': '#cf222e',
		'--ui-danger-text': '#cf222e',
		'--ui-code-bg': '#f6f8fa',
		'--ui-code-text': '#1f2328',
		'--ui-hover': '#eef1f4',
		'--ui-empty-bg': 'rgba(31, 35, 40, 0.04)',
		'--ui-overlay': 'rgba(208, 215, 222, 0.9)',
		'--ui-glow': 'rgba(31, 35, 40, 0.92)',
		'--ui-glow-muted': 'rgba(101, 109, 118, 0.46)',
		'--ui-glow-dim': 'rgba(101, 109, 118, 0.16)',
		'--ui-selection-text': '#ffffff',
		'color-scheme': 'light'
	}
} as const satisfies ColorScheme;

export default githubLight;
