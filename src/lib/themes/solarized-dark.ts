import type { ColorScheme } from './types';

const solarizedDark = {
	id: 'solarized-dark',
	label: 'Solarized Dark',
	variables: {
		'--ui-bg': '#002b36',
		'--ui-surface': '#073642',
		'--ui-surface-2': '#0c474d',
		'--ui-surface-strong': '#115b68',
		'--ui-border': '#115b68',
		'--ui-border-strong': '#00212b',
		'--ui-border-subtle': 'rgba(147, 161, 161, 0.08)',
		'--ui-text': '#839496',
		'--ui-muted': '#657b83',
		'--ui-accent': '#268bd2',
		'--ui-accent-strong': '#2aa198',
		'--ui-accent-border': '#268bd2',
		'--ui-success': '#859900',
		'--ui-success-bg': 'rgba(133, 153, 0, 0.12)',
		'--ui-success-border': '#859900',
		'--ui-success-text': '#859900',
		'--ui-warning': '#b58900',
		'--ui-warning-bg': 'rgba(181, 137, 0, 0.12)',
		'--ui-warning-border': '#b58900',
		'--ui-warning-text': '#b58900',
		'--ui-danger': '#dc322f',
		'--ui-danger-strong': '#cb4b16',
		'--ui-danger-bg': 'rgba(220, 50, 47, 0.12)',
		'--ui-danger-border': '#dc322f',
		'--ui-danger-text': '#dc322f',
		'--ui-code-bg': '#00212b',
		'--ui-code-text': '#839496',
		'--ui-hover': '#0a4049',
		'--ui-empty-bg': 'rgba(131, 148, 150, 0.04)',
		'--ui-overlay': 'rgba(0, 33, 43, 0.9)',
		'--ui-glow': 'rgba(131, 148, 150, 0.92)',
		'--ui-glow-muted': 'rgba(101, 123, 131, 0.46)',
		'--ui-glow-dim': 'rgba(101, 123, 131, 0.16)',
		'--ui-selection-text': '#002b36',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default solarizedDark;
