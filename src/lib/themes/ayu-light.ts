import type { ColorScheme } from './types';

const ayuLight = {
	id: 'ayu-light',
	label: 'Ayu Light',
	variables: {
		'--ui-bg': '#fafafa',
		'--ui-surface': '#f0f0f0',
		'--ui-surface-2': '#e6e6e6',
		'--ui-surface-strong': '#d9d9d9',
		'--ui-border': '#d9d9d9',
		'--ui-border-strong': '#c2c2c2',
		'--ui-border-subtle': 'rgba(92, 97, 102, 0.10)',
		'--ui-text': '#5c6166',
		'--ui-muted': '#8a8f93',
		'--ui-accent': '#39bae6',
		'--ui-accent-strong': '#4cbf99',
		'--ui-accent-border': '#39bae6',
		'--ui-success': '#86b300',
		'--ui-success-bg': 'rgba(134, 179, 0, 0.10)',
		'--ui-success-border': '#86b300',
		'--ui-success-text': '#86b300',
		'--ui-warning': '#f2ae49',
		'--ui-warning-bg': 'rgba(242, 174, 73, 0.10)',
		'--ui-warning-border': '#f2ae49',
		'--ui-warning-text': '#f2ae49',
		'--ui-danger': '#f07171',
		'--ui-danger-strong': '#e65050',
		'--ui-danger-bg': 'rgba(240, 113, 113, 0.10)',
		'--ui-danger-border': '#f07171',
		'--ui-danger-text': '#f07171',
		'--ui-code-bg': '#f0f0f0',
		'--ui-code-text': '#5c6166',
		'--ui-hover': '#e8e8e8',
		'--ui-empty-bg': 'rgba(92, 97, 102, 0.04)',
		'--ui-overlay': 'rgba(217, 217, 217, 0.9)',
		'--ui-glow': 'rgba(92, 97, 102, 0.92)',
		'--ui-glow-muted': 'rgba(138, 143, 147, 0.46)',
		'--ui-glow-dim': 'rgba(138, 143, 147, 0.16)',
		'--ui-selection-text': '#fafafa',
		'color-scheme': 'light'
	}
} as const satisfies ColorScheme;

export default ayuLight;
