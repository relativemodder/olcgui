import type { ColorScheme, ColorSchemeId } from './types';

export const colorSchemes: ColorScheme[] = [
	{ id: 'adwaita-dark', label: 'Adwaita Dark', href: '/themes/adwaita-dark.css' },
	{ id: 'adwaita-light', label: 'Adwaita Light', href: '/themes/adwaita-light.css' },
	{ id: 'ayu-dark', label: 'Ayu Dark', href: '/themes/ayu-dark.css' },
	{ id: 'ayu-light', label: 'Ayu Light', href: '/themes/ayu-light.css' },
	{ id: 'ayu-mirage', label: 'Ayu Mirage', href: '/themes/ayu-mirage.css' },
	{ id: 'breeze-dark', label: 'Breeze Dark', href: '/themes/breeze-dark.css' },
	{ id: 'breeze-light', label: 'Breeze Light', href: '/themes/breeze-light.css' },
	{ id: 'catppuccin-frappe', label: 'Catppuccin Frappe', href: '/themes/catppuccin-frappe.css' },
	{ id: 'catppuccin-latte', label: 'Catppuccin Latte', href: '/themes/catppuccin-latte.css' },
	{ id: 'catppuccin-macchiato', label: 'Catppuccin Macchiato', href: '/themes/catppuccin-macchiato.css' },
	{ id: 'catppuccin-mocha', label: 'Catppuccin Mocha', href: '/themes/catppuccin-mocha.css' },
	{ id: 'dracula', label: 'Dracula', href: '/themes/dracula.css' },
	{ id: 'github-dark', label: 'GitHub Dark', href: '/themes/github-dark.css' },
	{ id: 'github-light', label: 'GitHub Light', href: '/themes/github-light.css' },
	{ id: 'gruvbox-dark', label: 'Gruvbox Dark', href: '/themes/gruvbox-dark.css' },
	{ id: 'gruvbox-light', label: 'Gruvbox Light', href: '/themes/gruvbox-light.css' },
	{ id: 'metro-amoled', label: 'Metro AMOLED', href: '/themes/metro-amoled.css' },
	{ id: 'nord', label: 'Nord', href: '/themes/nord.css' },
	{ id: 'one-dark', label: 'One Dark', href: '/themes/one-dark.css' },
	{ id: 'solarized-dark', label: 'Solarized Dark', href: '/themes/solarized-dark.css' },
	{ id: 'solarized-light', label: 'Solarized Light', href: '/themes/solarized-light.css' },
	{ id: 'tokyo-night', label: 'Tokyo Night', href: '/themes/tokyo-night.css' }
];

export function getColorScheme(id: ColorSchemeId): ColorScheme {
	return colorSchemes.find((scheme) => scheme.id === id) ?? colorSchemes[0];
}
