import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';
import { colorSchemes, type ColorSchemeId } from '$lib/themes';
import type { AnimationMode } from './animation';
import type { TileVisibility } from './tileVisibility';

export const APP_SETTINGS_COOKIE = 'olcgui_settings';
export const APP_SETTINGS_CONTEXT = Symbol('olcgui-app-settings');

export type AppSettings = {
	colorScheme: ColorSchemeId;
	animationMode: AnimationMode;
	tileVisibility: TileVisibility;
};

export type AppSettingsStores = {
	colorScheme: Writable<ColorSchemeId>;
	animationMode: Writable<AnimationMode>;
	tileVisibility: Writable<TileVisibility>;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
	colorScheme: 'breeze-dark',
	animationMode: 'metro',
	tileVisibility: {
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
	}
};

export function normalizeAppSettings(partial: Partial<AppSettings> | null | undefined): AppSettings {
	const colorScheme =
		partial?.colorScheme && colorSchemes.some((scheme) => scheme.id === partial.colorScheme)
			? partial.colorScheme
			: DEFAULT_APP_SETTINGS.colorScheme;
	const animationMode =
		partial?.animationMode === 'metro' ||
		partial?.animationMode === 'fade' ||
		partial?.animationMode === 'none'
			? partial.animationMode
			: DEFAULT_APP_SETTINGS.animationMode;

	return {
		colorScheme,
		animationMode,
		tileVisibility: {
			...DEFAULT_APP_SETTINGS.tileVisibility,
			...(partial?.tileVisibility ?? {})
		}
	};
}

export function readAppSettingsCookie(value: string | null | undefined): Partial<AppSettings> | null {
	if (!value) return null;

	try {
		return JSON.parse(decodeURIComponent(value)) as Partial<AppSettings>;
	} catch {
		return null;
	}
}

export function createAppSettingsStores(initialValue: AppSettings): AppSettingsStores {
	const current: AppSettings = {
		colorScheme: initialValue.colorScheme,
		animationMode: initialValue.animationMode,
		tileVisibility: { ...initialValue.tileVisibility }
	};

	const writeCookie = () => {
		if (!browser) return;
		document.cookie = `${APP_SETTINGS_COOKIE}=${encodeURIComponent(JSON.stringify(current))}; Path=/; SameSite=Lax; Max-Age=31536000`;
	};

	const colorScheme = writable<ColorSchemeId>(current.colorScheme);
	const animationMode = writable<AnimationMode>(current.animationMode);
	const tileVisibility = writable<TileVisibility>(current.tileVisibility);

	colorScheme.subscribe((value) => {
		current.colorScheme = value;
		writeCookie();
	});

	animationMode.subscribe((value) => {
		current.animationMode = value;
		writeCookie();
	});

	tileVisibility.subscribe((value) => {
		current.tileVisibility = value;
		writeCookie();
	});

	return { colorScheme, animationMode, tileVisibility };
}
