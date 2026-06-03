import type { ColorSchemeId, ColorScheme } from './types';
import breezeDark from './breeze-dark';
import breezeLight from './breeze-light';
import metroAmoled from './metro-amoled';
import nord from './nord';
import dracula from './dracula';

export const colorSchemes: ColorScheme[] = [breezeDark, breezeLight, metroAmoled, nord, dracula];

export function getColorScheme(id: ColorSchemeId): ColorScheme {
	return colorSchemes.find((s) => s.id === id) ?? colorSchemes[0];
}
