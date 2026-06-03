export type ColorSchemeId =
	| 'breeze-dark'
	| 'breeze-light'
	| 'metro-amoled'
	| 'nord'
	| 'dracula'
	| 'catppuccin-mocha'
	| 'catppuccin-macchiato'
	| 'catppuccin-frappe'
	| 'catppuccin-latte'
	| 'tokyo-night'
	| 'github-dark'
	| 'github-light'
	| 'solarized-dark'
	| 'solarized-light'
	| 'one-dark'
	| 'gruvbox-dark'
	| 'gruvbox-light'
	| 'ayu-dark'
	| 'ayu-mirage'
	| 'ayu-light'
	| 'adwaita-dark'
	| 'adwaita-light';

export interface ColorScheme {
	id: ColorSchemeId;
	label: string;
	variables: Record<string, string>;
}
