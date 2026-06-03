export type ColorSchemeId = 'breeze-dark' | 'breeze-light' | 'metro-amoled' | 'nord' | 'dracula';

export interface ColorScheme {
	id: ColorSchemeId;
	label: string;
	variables: Record<string, string>;
}
