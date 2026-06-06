import { db } from '../db/client';
import { instances, logs as dbLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateYaml, type WizardConfig } from '$lib/wizard/utils';
import { evaluateRestart, type RestartMetrics } from './restartPolicy';
import { mkdirSync, writeFileSync, unlinkSync, existsSync, chmodSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { env } from '$env/dynamic/private';
import { randomBytes } from 'crypto';

export type UploadStatusCode = 'writing' | 'validating' | 'success' | 'error';
export interface UploadState {
	status: UploadStatusCode;
	message: string;
	fileName: string;
}

const uploads = new Map<string, UploadState>();

const VALIDATION_TIMEOUT_MS = 60_000;

export function getUploadStatus(uploadId: string): UploadState | null {
	return uploads.get(uploadId) ?? null;
}

export function startBinaryUpload(buffer: Buffer, fileName: string): { uploadId: string } {
	const uploadId = randomBytes(16).toString('hex');
	const dir = dirname(BINARY_PATH);
	mkdirSync(dir, { recursive: true });

	const tempPath = `${BINARY_PATH}.tmp.${uploadId}`;
	writeFileSync(tempPath, buffer);
	chmodSync(tempPath, 0o755);

	uploads.set(uploadId, { status: 'validating', message: 'Проверка бинарного файла…', fileName });

	validateBinary(uploadId, tempPath);

	return { uploadId };
}

async function validateBinary(uploadId: string, tempPath: string): Promise<void> {
	try {
		const proc = Bun.spawn([tempPath], { stdout: 'pipe', stderr: 'pipe' });

		const killTimer = setTimeout(() => {
			try {
				proc.kill(9);
			} catch {
				/* ignore */
			}
		}, VALIDATION_TIMEOUT_MS);

		try {
			const [stderrText, stdoutText] = await Promise.all([
				new Response(proc.stderr).text(),
				new Response(proc.stdout).text()
			]);
			await proc.exited;
			clearTimeout(killTimer);

			const output = stderrText + stdoutText;
			if (!output.includes('usage: olcrtc <config.yaml>')) {
				failUpload(
					uploadId,
					tempPath,
					'Файл не является корректным исполняемым файлом ядра olcrtc для данной архитектуры.'
				);
				return;
			}
		} finally {
			clearTimeout(killTimer);
		}

		renameSync(tempPath, BINARY_PATH);
		uploads.set(uploadId, {
			status: 'success',
			message: 'Бинарный файл успешно загружен и сохранён.',
			fileName: ''
		});
	} catch (err) {
		failUpload(
			uploadId,
			tempPath,
			err instanceof Error ? err.message : 'Ошибка проверки бинарного файла.'
		);
	}
}

function failUpload(uploadId: string, tempPath: string, message: string): void {
	try {
		unlinkSync(tempPath);
	} catch {
		/* ignore */
	}
	uploads.set(uploadId, { status: 'error', message, fileName: '' });
}

export interface ActiveInstance {
	id: number;
	process: ReturnType<typeof Bun.spawn>;
	startTime: number;
	consecutiveCrashes: number;
	logs: string[];
	status: 'running' | 'restarting' | 'error' | 'stopped';
	configPath: string;
	restartTimer?: Timer;
	expectedExit?: boolean;
	periodicRestartTimer?: Timer;
}

const activeInstances = new Map<number, ActiveInstance>();

const DATA_DIR = env.OLCRTC_DATA_DIR || './data/instances';
const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
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
		clearPeriodicRestartTimer(existing);
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
		const errMsg =
			'Исполняемый файл olcrtc не найден. Скорее всего он не был собран. Пожалуйста, соберите проект во вкладке Сборки.';
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

	if (instance.restartInterval && instance.restartInterval > 0) {
		const intervalMs = instance.restartInterval * 60 * 1000;
		activeBlock.periodicRestartTimer = setInterval(() => {
			internalPeriodicRestart(id).catch((e) =>
				console.error(`[ProcessManager] Periodic restart failed for instance ${id}:`, e)
			);
		}, intervalMs);
		await logInstanceLine(
			id,
			`[Manager] Periodic restart scheduled every ${instance.restartInterval} minute(s).`
		);
	}

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
		if (
			!block ||
			block.process !== childProcess ||
			block.expectedExit ||
			block.status === 'stopped'
		) {
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
	block.expectedExit = true;

	if (block.restartTimer) {
		clearTimeout(block.restartTimer);
		block.restartTimer = undefined;
	}

	clearPeriodicRestartTimer(block);

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

function clearPeriodicRestartTimer(block: ActiveInstance): void {
	if (block.periodicRestartTimer) {
		clearInterval(block.periodicRestartTimer);
		block.periodicRestartTimer = undefined;
	}
}

async function internalPeriodicRestart(id: number): Promise<void> {
	const block = activeInstances.get(id);
	if (!block || block.status === 'stopped') return;

	clearPeriodicRestartTimer(block);

	const [latestConfig] = await db.select().from(instances).where(eq(instances.id, id)).limit(1);
	if (!latestConfig || !latestConfig.restartInterval || latestConfig.restartInterval <= 0) return;

	await restartInstance(id);
}

export async function restartInstance(id: number): Promise<void> {
	const block = activeInstances.get(id);
	await db.update(instances).set({ status: 'restarting' }).where(eq(instances.id, id));

	if (!block) {
		await logInstanceLine(id, '[Manager] Manual restart requested while process was not active.');
		await startInstance(id);
		return;
	}

	console.log(`[ProcessManager] Restarting instance ${id}...`);

	block.status = 'restarting';
	block.expectedExit = true;

	if (block.restartTimer) {
		clearTimeout(block.restartTimer);
		block.restartTimer = undefined;
	}

	clearPeriodicRestartTimer(block);

	await logInstanceLine(id, '[Manager] Manual restart requested.');

	const forceKillTimer = setTimeout(() => {
		try {
			block.process.kill(9);
		} catch {}
	}, 1000);

	try {
		block.process.kill(15);
		await Promise.race([block.process.exited, new Promise((resolve) => setTimeout(resolve, 1500))]);
	} catch {}

	clearTimeout(forceKillTimer);

	if (existsSync(block.configPath)) {
		try {
			unlinkSync(block.configPath);
		} catch {}
	}

	try {
		await startInstance(id);
	} catch (error) {
		if (activeInstances.get(id) === block) {
			block.status = 'error';
		}
		throw error;
	}
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
