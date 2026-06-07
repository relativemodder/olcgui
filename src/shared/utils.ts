export function matchTopic(topic: string, pattern: string): boolean {
	if (pattern === '*') return true;
	if (pattern.endsWith(':*')) {
		return topic.startsWith(pattern.slice(0, -1));
	}
	if (pattern.endsWith('*')) {
		return topic.startsWith(pattern.slice(0, -1));
	}
	return topic === pattern;
}

export function parseCookie(raw: string, name: string): string | null {
	for (const part of raw.split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (decodeURIComponent(key) === name) return decodeURIComponent(value.join('='));
	}
	return null;
}
