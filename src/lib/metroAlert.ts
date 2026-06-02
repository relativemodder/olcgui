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

let nextAlertId = 1;

export const metroAlerts = writable<MetroAlert[]>([]);

function pushMetroAlert(alert: Omit<MetroAlert, 'id'>) {
	const id = nextAlertId++;
	metroAlerts.update((alerts) => [...alerts, { ...alert, id }]);
	return id;
}

export function dismissMetroAlert(id: number, accepted = false) {
	metroAlerts.update((alerts) => {
		const alert = alerts.find((item) => item.id === id);
		alert?.resolve?.(accepted);
		return alerts.filter((item) => item.id !== id);
	});
}

export function showMetroAlert(
	message: string,
	{
		title = 'Предупреждение',
		tone = 'error',
		confirmLabel = 'Закрыть'
	}: {
		title?: string;
		tone?: MetroAlertTone;
		confirmLabel?: string;
	} = {}
) {
	pushMetroAlert({
		title,
		message,
		tone,
		mode: 'alert',
		confirmLabel,
		cancelLabel: ''
	});
}

export function showMetroConfirm(
	message: string,
	{
		title = 'Подтверждение',
		tone = 'warning',
		confirmLabel = 'Подтвердить',
		cancelLabel = 'Отмена'
	}: {
		title?: string;
		tone?: MetroAlertTone;
		confirmLabel?: string;
		cancelLabel?: string;
	} = {}
) {
	return new Promise<boolean>((resolve) => {
		pushMetroAlert({
			title,
			message,
			tone,
			mode: 'confirm',
			confirmLabel,
			cancelLabel,
			resolve
		});
	});
}
