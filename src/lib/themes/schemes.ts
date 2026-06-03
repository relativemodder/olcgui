import type { ColorSchemeId, ColorScheme } from './types';
import breezeDark from './breeze-dark';
import breezeLight from './breeze-light';
import metroAmoled from './metro-amoled';
import nord from './nord';
import dracula from './dracula';
import catppuccinMocha from './catppuccin-mocha';
import catppuccinMacchiato from './catppuccin-macchiato';
import catppuccinFrappe from './catppuccin-frappe';
import catppuccinLatte from './catppuccin-latte';
import tokyoNight from './tokyo-night';
import githubDark from './github-dark';
import githubLight from './github-light';
import solarizedDark from './solarized-dark';
import solarizedLight from './solarized-light';
import oneDark from './one-dark';
import gruvboxDark from './gruvbox-dark';
import gruvboxLight from './gruvbox-light';
import ayuDark from './ayu-dark';
import ayuMirage from './ayu-mirage';
import ayuLight from './ayu-light';
import adwaitaDark from './adwaita-dark';
import adwaitaLight from './adwaita-light';

export const colorSchemes: ColorScheme[] = [
	breezeDark,
	breezeLight,
	metroAmoled,
	nord,
	dracula,
	catppuccinMocha,
	catppuccinMacchiato,
	catppuccinFrappe,
	catppuccinLatte,
	tokyoNight,
	githubDark,
	githubLight,
	solarizedDark,
	solarizedLight,
	oneDark,
	gruvboxDark,
	gruvboxLight,
	ayuDark,
	ayuMirage,
	ayuLight,
	adwaitaDark,
	adwaitaLight
];

export function getColorScheme(id: ColorSchemeId): ColorScheme {
	return colorSchemes.find((s) => s.id === id) ?? colorSchemes[0];
}
