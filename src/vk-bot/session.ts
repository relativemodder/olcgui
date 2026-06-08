const store = new Map<number, { flow: string; data: Record<string, unknown> }>();
const dedup = new Set<number>();
const responded = new Set<number>();
const userCooldowns = new Map<number, number>();

export function deduplicate(id: number): boolean {
	if (dedup.has(id)) return true;
	dedup.add(id);
	return false;
}

export function markResponded(id: number): void {
	responded.add(id);
}

export function hasResponded(id: number): boolean {
	return responded.has(id);
}

export function checkUserCooldown(vkId: number, minIntervalMs = 1000): boolean {
	const last = userCooldowns.get(vkId);
	const now = Date.now();
	if (last && now - last < minIntervalMs) return true;
	userCooldowns.set(vkId, now);
	return false;
}

export function clearUserCooldown(vkId: number): void {
	userCooldowns.delete(vkId);
}

export function getSession(vkId: number): { flow: string; data: Record<string, unknown> } | null {
	return store.get(vkId) ?? null;
}

export function setSession(vkId: number, flow: string, data: Record<string, unknown> = {}): void {
	store.set(vkId, { flow, data });
}

export function clearSession(vkId: number): void {
	store.delete(vkId);
}

export function clearAllSessions(): void {
	store.clear();
}
