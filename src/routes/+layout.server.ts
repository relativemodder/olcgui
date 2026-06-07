import type { LayoutServerLoad } from './$types';
import {
	APP_SETTINGS_COOKIE,
	normalizeAppSettings,
	readAppSettingsCookie
} from '$lib/stores/appSettings';


export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const settings = normalizeAppSettings(readAppSettingsCookie(cookies.get(APP_SETTINGS_COOKIE)));

	return {
		user: locals.user,
		setupNeeded: locals.setupNeeded,
		settings
	};
};
