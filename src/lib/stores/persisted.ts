import { writable, type Writable } from 'svelte/store';

export function persistedWritable<T>(key: string, defaultValue: T): Writable<T> {
	let initial = defaultValue;

	if (typeof localStorage !== 'undefined') {
		try {
			const stored = localStorage.getItem(key);
			if (stored !== null) {
				initial = JSON.parse(stored) as T;
			}
		} catch {}
	}

	const store = writable<T>(initial);

	if (typeof localStorage !== 'undefined') {
		store.subscribe((value) => {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch {}
		});
	}

	return store;
}
