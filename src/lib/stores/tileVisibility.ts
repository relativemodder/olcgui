import { writable } from 'svelte/store';

export type TileVisibility = {
	systemMonitor: boolean;
	cpuStat: boolean;
	ramStat: boolean;
	iowaitStat: boolean;
	networkStat: boolean;
	statCards: boolean;
	totalTunnelsStat: boolean;
	activeStat: boolean;
	restartingStat: boolean;
	errorStat: boolean;
	roomUrl: boolean;
	cryptoKey: boolean;
	socksInfo: boolean;
};

const defaults: TileVisibility = {
	systemMonitor: true,
	cpuStat: true,
	ramStat: true,
	iowaitStat: true,
	networkStat: true,
	statCards: true,
	totalTunnelsStat: true,
	activeStat: true,
	restartingStat: true,
	errorStat: true,
	roomUrl: true,
	cryptoKey: true,
	socksInfo: true
};

function loadWithDefaults(): TileVisibility {
	if (typeof localStorage === 'undefined') return { ...defaults };
	try {
		const stored = localStorage.getItem('olcgui:tileVisibility');
		if (stored === null) return { ...defaults };
		const parsed = JSON.parse(stored);
		return { ...defaults, ...parsed };
	} catch {
		return { ...defaults };
	}
}

export const tileVisibility = writable<TileVisibility>(loadWithDefaults());

if (typeof localStorage !== 'undefined') {
	tileVisibility.subscribe(($v) => {
		try {
			localStorage.setItem('olcgui:tileVisibility', JSON.stringify($v));
		} catch {}
	});
}
