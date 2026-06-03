import type { ColorScheme } from './types';

const nord = {
	id: 'nord',
	label: 'Nord',
	variables: {
		'--ui-bg': '#2e3440',
		'--ui-surface': '#3b4252',
		'--ui-surface-2': '#434c5e',
		'--ui-surface-strong': '#4c566a',
		'--ui-border': '#4c566a',
		'--ui-border-strong': '#2e3440',
		'--ui-border-subtle': 'rgba(216, 222, 233, 0.06)',
		'--ui-text': '#eceff4',
		'--ui-muted': '#d8dee9',
		'--ui-accent': '#88c0d0',
		'--ui-accent-strong': '#81a1c1',
		'--ui-accent-border': '#5e81ac',
		'--ui-success': '#a3be8c',
		'--ui-success-bg': '#334033',
		'--ui-success-border': '#6a8a5c',
		'--ui-success-text': '#c8d8b8',
		'--ui-warning': '#d08770',
		'--ui-warning-bg': '#403330',
		'--ui-warning-border': '#a86a5a',
		'--ui-warning-text': '#e8b8a8',
		'--ui-danger': '#bf616a',
		'--ui-danger-strong': '#8a3a43',
		'--ui-danger-bg': '#3a2a2e',
		'--ui-danger-border': '#9a4a53',
		'--ui-danger-text': '#e8a0a8',
		'--ui-code-bg': '#2e3440',
		'--ui-code-text': '#eceff4',
		'--ui-empty-bg': 'rgba(216, 222, 233, 0.04)',
		'--ui-overlay': 'rgba(0, 0, 0, 0.7)',
		'--ui-glow': 'rgba(236, 239, 244, 0.88)',
		'--ui-glow-muted': 'rgba(216, 222, 233, 0.40)',
		'--ui-glow-dim': 'rgba(216, 222, 233, 0.14)',
		'--ui-selection-text': '#ffffff',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default nord;
