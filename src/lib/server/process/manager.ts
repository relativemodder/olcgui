import { db } from '../db/client';
import { instances, logs as dbLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateYaml, type WizardConfig } from '$lib/wizard/utils';
import { evaluateRestart, type RestartMetrics } from './restartPolicy';
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { env } from '$env/dynamic/private';

export interface ActiveInstance {
	id: number;
	process: ReturnType<typeof Bun.spawn>;
	startTime: number;
	consecutiveCrashes: number;
	logs: string[];
	status: 'running' | 'restarting' | 'error' | 'stopped';
	configPath: string;
	restartTimer?: Timer;
}

const activeInstances = new Map<number, ActiveInstance>();

const DATA_DIR = env.OLCRTC_DATA_DIR || './data/instances';
const arch = process.arch === 'arm64' || process.arch === 'aarch64' ? 'arm64' : 'amd64';
const BINARY_PATH =
	env.OLCRTC_BINARY_PATH || join(process.cwd(), `olcrtc/build/olcrtc-linux-${arch}`);

try {
	mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
	console.error('[ProcessManager] Failed to create data directory:', e);
}

export function getInstanceLogs(id: number): string[] {
	return activeInstances.get(id)?.logs || [];
}

export function getInstanceStatus(id: number): 'running' | 'restarting' | 'error' | 'stopped' {
	return activeInstances.get(id)?.status || 'stopped';
}

export async function startInstance(id: number): Promise<void> {
	const existing = activeInstances.get(id);
	if (existing) {
		if (existing.status === 'running') {
			console.log(`[ProcessManager] Instance ${id} is already running.`);
			return;
		}
		if (existing.restartTimer) {
			clearTimeout(existing.restartTimer);
		}
	}

	const [instance] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
	if (!instance) {
		throw new Error(`Instance config ${id} not found in database.`);
	}

	console.log(`[ProcessManager] Starting instance "${instance.name}" (ID: ${id})...`);

	const wizardConfig: WizardConfig = {
		provider: instance.provider,
		roomUrl: instance.roomUrl,
		cryptoKey: instance.cryptoKey,
		transport: instance.transport,
		dns: instance.dns,
		socksHost: instance.socksHost,
		socksPort: instance.socksPort || 8808,
		socksUser: instance.socksUser || undefined,
		socksPass: instance.socksPass || undefined,
		debug: instance.debug
	};

	const yamlContent = generateYaml(wizardConfig, instance.mode);
	const configPath = join(DATA_DIR, `config_${id}.yaml`);

	writeFileSync(configPath, yamlContent, 'utf-8');

	if (!existsSync(BINARY_PATH)) {
		const errMsg = 'Компилятор olcrtc не найден. Пожалуйста, соберите проект во вкладке Сборки.';
		await db.update(instances).set({ status: 'error' }).where(eq(instances.id, id));
		await db.insert(dbLogs).values({
			instanceId: id,
			logLine: `[ERROR] ${errMsg}`
		});
		throw new Error(errMsg);
	}

	const startTime = Date.now();
	const consecutiveCrashes = existing ? existing.consecutiveCrashes : 0;

	const childProcess = Bun.spawn([BINARY_PATH, configPath], {
		stdout: 'pipe',
		stderr: 'pipe'
	});

	const activeBlock: ActiveInstance = {
		id,
		process: childProcess,
		startTime,
		consecutiveCrashes,
		logs: existing ? existing.logs : [],
		status: 'running',
		configPath
	};

	activeInstances.set(id, activeBlock);

	await db.update(instances).set({ status: 'running' }).where(eq(instances.id, id));
	await logInstanceLine(id, `[Manager] Process spawned successfully. PID: ${childProcess.pid}`);

	async function streamOutput(stream: ReadableStream<Uint8Array>, streamName: 'STDOUT' | 'STDERR') {
		const reader = stream.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim()) {
						const formattedLine = `[${streamName}] ${line}`;
						await logInstanceLine(id, formattedLine);
					}
				}
			}
		} catch (err) {
			await logInstanceLine(
				id,
				`[ERROR] Failed to read ${streamName} stream: ${err instanceof Error ? err.message : String(err)}`
			);
		} finally {
			reader.releaseLock();
		}
	}

	streamOutput(childProcess.stdout, 'STDOUT');
	streamOutput(childProcess.stderr, 'STDERR');

	(async () => {
		const exitCode = await childProcess.exited;
		await logInstanceLine(id, `[Manager] Process terminated with exit code ${exitCode}.`);

		const block = activeInstances.get(id);
		if (!block || block.status === 'stopped') {
			return;
		}

		const [latestConfig] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
		const autoRestart = latestConfig ? latestConfig.autoRestart : true;

		if (!autoRestart) {
			block.status = 'stopped';
			await db.update(instances).set({ status: 'stopped' }).where(eq(instances.id, id));
			return;
		}

		const metrics: RestartMetrics = {
			consecutiveCrashes: block.consecutiveCrashes,
			lastCrashTime: Date.now()
		};

		const restartDecision = evaluateRestart(block.startTime, metrics);

		block.consecutiveCrashes = restartDecision.newMetrics.consecutiveCrashes;

		if (restartDecision.shouldRestart) {
			block.status = 'restarting';
			await db.update(instances).set({ status: 'restarting' }).where(eq(instances.id, id));
			await logInstanceLine(
				id,
				`[Manager] Scheduling automatic restart in ${restartDecision.delayMs}ms (Retry ${block.consecutiveCrashes})...`
			);

			block.restartTimer = setTimeout(() => {
				startInstance(id);
			}, restartDecision.delayMs);
		} else {
			block.status = 'error';
			await db.update(instances).set({ status: 'error' }).where(eq(instances.id, id));
			await logInstanceLine(
				id,
				`[CRITICAL] Infinite crash loop detected (crashed ${block.consecutiveCrashes} times consecutively). Automatic restart suspended.`
			);
		}
	})();
}

export async function stopInstance(id: number): Promise<void> {
	const block = activeInstances.get(id);
	if (!block) {
		await db.update(instances).set({ status: 'stopped' }).where(eq(instances.id, id));
		return;
	}

	console.log(`[ProcessManager] Stopping instance ${id}...`);

	block.status = 'stopped';

	if (block.restartTimer) {
		clearTimeout(block.restartTimer);
	}

	try {
		block.process.kill(15);
		setTimeout(() => {
			try {
				block.process.kill(9);
			} catch {}
		}, 1000);
	} catch {}

	if (existsSync(block.configPath)) {
		try {
			unlinkSync(block.configPath);
		} catch {}
	}

	await logInstanceLine(id, '[Manager] Process terminated manually.');
	await db.update(instances).set({ status: 'stopped' }).where(eq(instances.id, id));
}

async function logInstanceLine(instanceId: number, line: string): Promise<void> {
	const block = activeInstances.get(instanceId);
	if (block) {
		block.logs.push(line);
		if (block.logs.length > 500) {
			block.logs.shift();
		}
	}

	try {
		await db.insert(dbLogs).values({
			instanceId,
			logLine: line
		});
	} catch (err) {
		console.error('[ProcessManager] Failed to save log line to DB:', err);
	}
}

export async function initProcessManager(): Promise<void> {
	console.log('[ProcessManager] Initializing process supervisor...');
	try {
		const runningInstances = await db
			.select()
			.from(instances)
			.where(eq(instances.status, 'running'));

		for (const inst of runningInstances) {
			if (inst.autoRestart) {
				console.log(
					`[ProcessManager] Resuming instance "${inst.name}" (ID: ${inst.id}) after reboot.`
				);
				startInstance(inst.id).catch((e) =>
					console.error(`[ProcessManager] Failed to resume instance ${inst.id}:`, e)
				);
			} else {
				await db.update(instances).set({ status: 'stopped' }).where(eq(instances.id, inst.id));
			}
		}
	} catch (error) {
		console.error('[ProcessManager] Boot supervisor restoration failed:', error);
	}
}

function cleanupChildProcesses() {
	console.log('[ProcessManager] Shutting down, killing all child processes...');
	for (const block of activeInstances.values()) {
		try {
			block.process.kill(9);
		} catch {}
	}
	process.exit(0);
}

process.on('SIGINT', cleanupChildProcesses);
process.on('SIGTERM', cleanupChildProcesses);
