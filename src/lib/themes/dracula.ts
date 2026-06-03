import type { ColorScheme } from './types';

const dracula = {
	id: 'dracula',
	label: 'Dracula',
	variables: {
		'--ui-bg': '#282a36',
		'--ui-surface': '#343746',
		'--ui-surface-2': '#3d4050',
		'--ui-surface-strong': '#4a4d5e',
		'--ui-border': '#525670',
		'--ui-border-strong': '#21222c',
		'--ui-border-subtle': 'rgba(248, 248, 242, 0.06)',
		'--ui-text': '#f8f8f2',
		'--ui-muted': '#bd93f9',
		'--ui-accent': '#ff79c6',
		'--ui-accent-strong': '#ff55b0',
		'--ui-accent-border': '#cc4499',
		'--ui-success': '#50fa7b',
		'--ui-success-bg': '#2a4a30',
		'--ui-success-border': '#3a8a4b',
		'--ui-success-text': '#8affa8',
		'--ui-warning': '#ffb86c',
		'--ui-warning-bg': '#4a3820',
		'--ui-warning-border': '#b8883a',
		'--ui-warning-text': '#ffd8a0',
		'--ui-danger': '#ff5555',
		'--ui-danger-strong': '#aa2222',
		'--ui-danger-bg': '#3a2020',
		'--ui-danger-border': '#aa3333',
		'--ui-danger-text': '#ff8888',
		'--ui-code-bg': '#21222c',
		'--ui-code-text': '#f8f8f2',
		'--ui-empty-bg': 'rgba(248, 248, 242, 0.04)',
		'--ui-overlay': 'rgba(0, 0, 0, 0.8)',
		'--ui-glow': 'rgba(248, 248, 242, 0.88)',
		'--ui-glow-muted': 'rgba(189, 147, 249, 0.40)',
		'--ui-glow-dim': 'rgba(189, 147, 249, 0.14)',
		'--ui-selection-text': '#ffffff',
		'color-scheme': 'dark'
	}
} as const satisfies ColorScheme;

export default dracula;
