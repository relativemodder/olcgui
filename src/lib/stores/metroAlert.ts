import { writable } from 'svelte/store';

export type MetroAlertTone = 'error' | 'success' | 'warning' | 'info';

export type MetroAlert = {
	id: number;
	title: string;
	message: string;
	tone: MetroAlertTone;
	mode: 'alert' | 'confirm';
	confirmLabel: string;
	cancelLabel: string;
	resolve?: (accepted: boolean) => void;
};

export const metroAlerts = writable<MetroAlert[]>([]);
