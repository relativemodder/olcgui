interface SerialPollerOptions {
	intervalMs: number;
	failureIntervalMs?: number;
	timeoutMs?: number;
	run: (signal: AbortSignal) => Promise<boolean | void>;
	shouldRun?: () => boolean;
	onError?: (error: unknown) => void;
}

interface StartOptions {
	immediate?: boolean;
}

export interface SerialPoller {
	start: (options?: StartOptions) => void;
	stop: () => void;
	trigger: () => void;
	isActive: () => boolean;
}

export function createSerialPoller({
	intervalMs,
	failureIntervalMs = Math.max(intervalMs * 2, 5000),
	timeoutMs = 10000,
	run,
	shouldRun = () => true,
	onError
}: SerialPollerOptions): SerialPoller {
	let active = false;
	let inFlight = false;
	let runAfterCurrent = false;
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let controller: AbortController | null = null;

	function clearScheduled() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	}

	function schedule(delayMs: number) {
		if (!active) return;

		clearScheduled();
		timeout = setTimeout(() => {
			void tick();
		}, delayMs);
	}

	async function tick() {
		if (!active) return;

		if (inFlight) {
			runAfterCurrent = true;
			return;
		}

		if (!shouldRun()) {
			schedule(intervalMs);
			return;
		}

		inFlight = true;
		controller = new AbortController();
		let nextDelay = intervalMs;
		let continuePolling = true;
		let timedOut = false;
		const timeoutId = setTimeout(() => {
			timedOut = true;
			controller?.abort();
		}, timeoutMs);

		try {
			const result = await run(controller.signal);
			if (result === false) {
				continuePolling = false;
			}
		} catch (error) {
			if (!isAbortError(error) || timedOut) {
				onError?.(timedOut ? new Error(`Polling request timed out after ${timeoutMs}ms`) : error);
				nextDelay = failureIntervalMs;
			}
		} finally {
			clearTimeout(timeoutId);
			inFlight = false;
			controller = null;
		}

		if (!active) return;

		if (!continuePolling) {
			active = false;
			clearScheduled();
			return;
		}

		if (runAfterCurrent) {
			runAfterCurrent = false;
			schedule(0);
			return;
		}

		schedule(nextDelay);
	}

	return {
		start({ immediate = true }: StartOptions = {}) {
			if (active) return;

			active = true;
			if (immediate) {
				void tick();
			} else {
				schedule(intervalMs);
			}
		},
		stop() {
			active = false;
			runAfterCurrent = false;
			clearScheduled();
			controller?.abort();
			controller = null;
		},
		trigger() {
			if (!active) {
				active = true;
			}

			clearScheduled();

			if (inFlight) {
				runAfterCurrent = true;
				return;
			}

			void tick();
		},
		isActive() {
			return active;
		}
	};
}

export function canPollNow() {
	const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
	const online = typeof navigator === 'undefined' || navigator.onLine !== false;

	return visible && online;
}

function isAbortError(error: unknown) {
	return error instanceof DOMException && error.name === 'AbortError';
}
