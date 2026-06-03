import type { ColorScheme } from './types';

const catppuccinFrappe = {
	id: 'catppuccin-frappe',
	label: 'Catppuccin Frappé',
	variables: {
		'--ui-bg': '#303446',
		'--ui-surface': '#414559',
		'--ui-surface-2': '#51576d',
		'--ui-surface-strong': '#626880',
		'--ui-border': '#51576d',
		'--ui-border-strong': '#232634',
		'--ui-border-subtle': 'rgba(198, 208, 245, 0.08)',
		'--ui-text': '#c6d0f5',
		'--ui-muted': '#949cbb',
		'--ui-accent': '#8caaee',
		'--ui-accent-strong': '#85c1dc',
		'--ui-accent-border': '#8caaee',
		'--ui-success': '#a6d189',
		'--ui-success-bg': 'rgba(166, 209, 137, 0.12)',
		'--ui-success-border': '#a6d189',
		'--ui-success-text': '#a6d189',
		'--ui-warning': '#e5c890',
		'--ui-warning-bg': 'rgba(229, 200, 144, 0.12)',
		'--ui-warning-border': '#e5c890',
		'--ui-warning-text': '#e5c890',
		'--ui-danger': '#e78284',
		'--ui-danger-strong': '#ea999c',
		'--ui-danger-bg': 'rgba(231, 130, 132, 0.12)',
		'--ui-danger-border': '#e78284',
		'--ui-danger-text': '#e78284',
		'--ui-code-bg': '#292c3c',
		'--ui-code-text': '#c6d0f5',
		'--ui-hover': '#4a4e63',
		'--ui-empty-bg': 'rgba(198, 208, 245, 0.04)',
		'--ui-overlay': 'rgba(35, 38, 52, 0.9)',
		'--ui-glow': 'rgba(198, 208, 245, 0.92)',
		'--ui-glow-muted': 'rgba(148, 156, 187, 0.46)',
		'--ui-glow-dim': 'rgba(148, 156, 187, 0.16)',
		'--ui-selection-text': '#303446',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default catppuccinFrappe;
