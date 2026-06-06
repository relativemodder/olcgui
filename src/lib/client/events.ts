type EventHandler = (data: unknown) => void;

function matchTopic(topic: string, pattern: string): boolean {
	if (pattern === '*') return true;
	if (pattern.endsWith(':*')) {
		return topic.startsWith(pattern.slice(0, -1));
	}
	if (pattern.endsWith('*')) {
		return topic.startsWith(pattern.slice(0, -1));
	}
	return topic === pattern;
}

function canPollNow() {
	if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false;
	if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
	return true;
}

export interface EventConnection {
	close: () => void;
	updateTopics: (topics: string[]) => void;
	on: (pattern: string, handler: EventHandler) => void;
	onStatusChange: (cb: (connected: boolean) => void) => void;
}

const HEARTBEAT_TIMEOUT = 45000;
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function connectEvents(topics: string[]): EventConnection {
	let destroyed = false;
	let es: EventSource | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
	let lastMessageTime = 0;
	let reconnectAttempt = 0;
	let statusChangeCb: ((connected: boolean) => void) | null = null;
	let currentTopics = topics;
	const handlers = new Map<string, Set<EventHandler>>();

	function setConnected(v: boolean) {
		statusChangeCb?.(v);
	}

	function connect(topicList: string[]) {
		disconnect();

		if (destroyed) return;

		if (!canPollNow()) {
			scheduleReconnect(topicList, 500);
			return;
		}

		reconnectAttempt = 0;
		lastMessageTime = Date.now();

		es = new EventSource(`/api/events?topics=${encodeURIComponent(topicList.join(','))}`);

		es.onmessage = (e: MessageEvent) => {
			lastMessageTime = Date.now();
			reconnectAttempt = 0;
			setConnected(true);
			try {
				const { topic, data } = JSON.parse(e.data);
				for (const [pattern, handlerSet] of handlers) {
					if (matchTopic(topic, pattern)) {
						for (const handler of handlerSet) {
							handler(data);
						}
					}
				}
			} catch (err) {
				console.error('[Events] Failed to parse event:', err);
			}
		};

		es.onerror = () => {
			cleanupEs();
			setConnected(false);
			scheduleReconnect(topicList);
		};

		es.onopen = () => {
			setConnected(true);
		};

		startHeartbeatCheck();
	}

	function cleanupEs() {
		if (es) {
			es.onmessage = null;
			es.onerror = null;
			es.onopen = null;
			try {
				es.close();
			} catch {}
			es = null;
		}
	}

	function disconnect() {
		cleanupEs();
		stopHeartbeatCheck();
	}

	function scheduleReconnect(topicList: string[], delay?: number) {
		if (destroyed) return;
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}

		if (!canPollNow()) {
			reconnectTimer = setTimeout(() => scheduleReconnect(topicList, delay), 1000);
			return;
		}

		const ms =
			delay ??
			Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY);
		reconnectAttempt++;
		reconnectTimer = setTimeout(() => connect(topicList), ms);
	}

	function startHeartbeatCheck() {
		stopHeartbeatCheck();
		heartbeatTimer = setInterval(() => {
			if (destroyed) return;
			if (es && Date.now() - lastMessageTime > HEARTBEAT_TIMEOUT) {
				const topicList = currentTopics;
				cleanupEs();
				setConnected(false);
				scheduleReconnect(topicList);
			}
		}, 10000);
	}

	function stopHeartbeatCheck() {
		if (heartbeatTimer) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
	}

	function handleVisibility() {
		if (destroyed) return;
		if (canPollNow() && !es) {
			connect(currentTopics);
		} else if (!canPollNow() && es) {
			cleanupEs();
			setConnected(false);
		}
	}

	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', handleVisibility);
		window.addEventListener('online', handleVisibility);
		window.addEventListener('offline', handleVisibility);
	}

	connect(currentTopics);

	return {
		close() {
			destroyed = true;
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', handleVisibility);
				window.removeEventListener('online', handleVisibility);
				window.removeEventListener('offline', handleVisibility);
			}
			disconnect();
		},
		updateTopics(newTopics: string[]) {
			if (destroyed) return;
			currentTopics = newTopics;
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
			reconnectAttempt = 0;
			connect(newTopics);
		},
		on(pattern: string, handler: EventHandler) {
			if (!handlers.has(pattern)) {
				handlers.set(pattern, new Set());
			}
			handlers.get(pattern)!.add(handler);
		},
		onStatusChange(cb: (connected: boolean) => void) {
			statusChangeCb = cb;
		}
	};
}
