import type { ColorScheme } from './types';

const breezeLight = {
	id: 'breeze-light',
	label: 'Breeze Light',
	variables: {
		'--ui-bg': '#eff0f1',
		'--ui-surface': '#fcfcfc',
		'--ui-surface-2': '#f0f0f0',
		'--ui-surface-strong': '#e0e0e0',
		'--ui-border': '#bdc3c7',
		'--ui-border-strong': '#9ba0a5',
		'--ui-border-subtle': 'rgba(0, 0, 0, 0.08)',
		'--ui-text': '#232629',
		'--ui-muted': '#7f8c8d',
		'--ui-accent': '#3daee9',
		'--ui-accent-strong': '#1d99f3',
		'--ui-accent-border': '#1688c5',
		'--ui-success': '#27ae60',
		'--ui-success-bg': '#d5f5e3',
		'--ui-success-border': '#2f8e55',
		'--ui-success-text': '#1e8449',
		'--ui-warning': '#f67400',
		'--ui-warning-bg': '#fdebd0',
		'--ui-warning-border': '#b85d00',
		'--ui-warning-text': '#a85d00',
		'--ui-danger': '#da4453',
		'--ui-danger-strong': '#8f2f3b',
		'--ui-danger-bg': '#fadbd8',
		'--ui-danger-border': '#a83f4a',
		'--ui-danger-text': '#922b36',
		'--ui-code-bg': '#f5f5f5',
		'--ui-code-text': '#232629',
		'--ui-hover': '#f0f0f0',
		'--ui-empty-bg': 'rgba(0, 0, 0, 0.04)',
		'--ui-overlay': 'rgba(0, 0, 0, 0.5)',
		'--ui-glow': 'rgba(0, 38, 41, 0.6)',
		'--ui-glow-muted': 'rgba(20, 20, 20, 0.6)',
		'--ui-glow-dim': 'rgba(20, 20, 20, 0.6)',
		'--ui-selection-text': '#ffffff',
		'color-scheme': 'light'
	}
} as const satisfies ColorScheme;

export default breezeLight;
