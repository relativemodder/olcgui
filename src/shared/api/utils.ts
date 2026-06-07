export function buildUrl(baseUrl: string, path: string): string {
	if (!baseUrl) return path;
	const base = baseUrl.replace(/\/+$/, '');
	const p = path.replace(/^\/+/, '');
	return `${base}/${p}`;
}
