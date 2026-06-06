import { describe, expect, it } from 'bun:test';
import { evaluateRestart } from '../src/server/process/restartPolicy';

describe('Process Supervisor & Restart Policy Unit Tests', () => {
	it('should calculate exponential backoff delay correctly on consecutive failures', () => {
		const metrics = { consecutiveCrashes: 0, lastCrashTime: 0 };

		// 1st crash - rapid failure (started 2 seconds ago, stable limit is 30s)
		const startTime1 = Date.now() - 2000;
		const r1 = evaluateRestart(startTime1, metrics);

		expect(r1.shouldRestart).toBe(true);
		expect(r1.delayMs).toBe(2000); // Base 1000 * 2^1 = 2000ms
		expect(r1.newMetrics.consecutiveCrashes).toBe(1);

		// 2nd crash
		const startTime2 = Date.now() - 2000;
		const r2 = evaluateRestart(startTime2, r1.newMetrics);

		expect(r2.shouldRestart).toBe(true);
		expect(r2.delayMs).toBe(4000); // 1000 * 2^2 = 4000ms
		expect(r2.newMetrics.consecutiveCrashes).toBe(2);

		// 3rd crash
		const startTime3 = Date.now() - 2000;
		const r3 = evaluateRestart(startTime3, r2.newMetrics);

		expect(r3.shouldRestart).toBe(true);
		expect(r3.delayMs).toBe(8000); // 1000 * 2^3 = 8000ms
		expect(r3.newMetrics.consecutiveCrashes).toBe(3);
	});

	it('should reset consecutive crash count to zero if process was running stably (>30s)', () => {
		const highCrashesMetrics = { consecutiveCrashes: 4, lastCrashTime: Date.now() - 60000 };

		// Stable run (started 45 seconds ago)
		const startTime = Date.now() - 45000;
		const r = evaluateRestart(startTime, highCrashesMetrics);

		expect(r.shouldRestart).toBe(true);
		expect(r.newMetrics.consecutiveCrashes).toBe(0); // Reset crash count!
		expect(r.delayMs).toBe(1000); // Delay for fresh single crash: 1000 * 2^0
	});

	it('should refuse to restart and return false once consecutive crash threshold (>5) is exceeded', () => {
		const metrics = { consecutiveCrashes: 4, lastCrashTime: Date.now() };

		// 5th consecutive crash (rapid crash)
		const r5 = evaluateRestart(Date.now() - 1000, metrics);
		expect(r5.shouldRestart).toBe(true);
		expect(r5.newMetrics.consecutiveCrashes).toBe(5);

		// 6th consecutive crash - limit exceeded
		const r6 = evaluateRestart(Date.now() - 1000, r5.newMetrics);
		expect(r6.shouldRestart).toBe(false); // Halt restarts!
		expect(r6.newMetrics.consecutiveCrashes).toBe(6);
	});
});
