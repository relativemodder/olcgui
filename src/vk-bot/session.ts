const store = new Map<number, { flow: string; data: Record<string, unknown> }>();
const dedup = new Map<number, number>();
const responded = new Map<number, number>();
const userCooldowns = new Map<number, number>();

const MESSAGE_STATE_TTL_MS = 10 * 60 * 1000;
const MAX_TRACKED_MESSAGE_IDS = 5000;

function pruneMessageState(state: Map<number, number>, now: number): void {
	for (const [id, seenAt] of state) {
		if (now - seenAt > MESSAGE_STATE_TTL_MS) {
			state.delete(id);
		}
	}

	while (state.size > MAX_TRACKED_MESSAGE_IDS) {
		const oldestId = state.keys().next().value;
		if (oldestId === undefined) break;
		state.delete(oldestId);
	}
}

export function deduplicate(id: number): boolean {
	const now = Date.now();
	pruneMessageState(dedup, now);
	if (dedup.has(id)) return true;
	dedup.set(id, now);
	return false;
}

export function markResponded(id: number): void {
	const now = Date.now();
	pruneMessageState(responded, now);
	responded.set(id, now);
}

export function hasResponded(id: number): boolean {
	const now = Date.now();
	pruneMessageState(responded, now);
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

export function resetRuntimeState(): void {
	store.clear();
	dedup.clear();
	responded.clear();
	userCooldowns.clear();
}
