import { writable } from 'svelte/store';

export type Toast = {
	id: number;
	message: string;
};

const toasts = writable<Toast[]>([]);
let nextId = 1;

export function showToast(message: string, durationMs = 3000) {
	const id = nextId++;
	toasts.update((t) => [...t, { id, message }]);
	setTimeout(() => {
		toasts.update((t) => t.filter((x) => x.id !== id));
	}, durationMs);
}

export default toasts;
