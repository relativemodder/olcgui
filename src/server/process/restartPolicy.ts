export interface RestartMetrics {
	consecutiveCrashes: number;
	lastCrashTime: number;
}

const STABLE_RUN_THRESHOLD_MS = 30000;
const MAX_CONSECUTIVE_CRASHES = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

export function evaluateRestart(
	startTime: number,
	currentMetrics: RestartMetrics
): {
	shouldRestart: boolean;
	delayMs: number;
	newMetrics: RestartMetrics;
} {
	const runDuration = Date.now() - startTime;
	const isStableRun = runDuration >= STABLE_RUN_THRESHOLD_MS;

	const consecutiveCrashes = isStableRun ? 0 : currentMetrics.consecutiveCrashes + 1;
	const lastCrashTime = Date.now();

	const newMetrics: RestartMetrics = {
		consecutiveCrashes,
		lastCrashTime
	};

	if (consecutiveCrashes > MAX_CONSECUTIVE_CRASHES) {
		return {
			shouldRestart: false,
			delayMs: 0,
			newMetrics
		};
	}

	const delayMs = Math.min(BASE_BACKOFF_MS * Math.pow(2, consecutiveCrashes), MAX_BACKOFF_MS);

	return {
		shouldRestart: true,
		delayMs,
		newMetrics
	};
}
