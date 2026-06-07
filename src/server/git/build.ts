import { getCurrentBranchName } from './client';
import { broker } from '../events/broker';
import { BUILD_STATUS_TOPIC, BUILD_LOG_TOPIC } from '../events/topics';
import { forEachLine } from '../utils';

export interface BuildState {
	isBuilding: boolean;
	logs: string[];
	success: boolean | null;
	startedAt: number | null;
	finishedAt: number | null;
	branch: string | null;
}

let activeBuildState: BuildState = {
	isBuilding: false,
	logs: [],
	success: null,
	startedAt: null,
	finishedAt: null,
	branch: null
};

const BUILD_DIR = Bun.env.OLCRTC_BUILD_DIR || `${process.cwd()}/olcrtc`;

export function getBuildStatus(): BuildState {
	return { ...activeBuildState };
}

export function startBuild(): void {
	if (activeBuildState.isBuilding) {
		console.warn('[BuildService] Build already in progress, skipping start.');
		return;
	}

	const branch = getCurrentBranchName();

	activeBuildState = {
		isBuilding: true,
		logs: [`[Build] Starting build process for branch "${branch}"...`],
		success: null,
		startedAt: Date.now(),
		finishedAt: null,
		branch
	};

	broker.publish(BUILD_LOG_TOPIC, {
		logLine: `[Build] Starting build process for branch "${branch}"...`
	});
	broker.publish(BUILD_STATUS_TOPIC, { ...activeBuildState });

	console.log(`[BuildService] Initiating build on branch "${branch}"`);

	const mageCmd = Bun.env.MAGE_CMD || 'mage';
	const childProcess = Bun.spawn(['bash', '-c', `exec ${mageCmd} build`], {
		cwd: BUILD_DIR,
		stdout: 'pipe',
		stderr: 'pipe'
	});

	async function streamOutput(stream: ReadableStream<Uint8Array>, type: 'STDOUT' | 'STDERR') {
		try {
			await forEachLine(stream, (line) => {
				const formatted = `[${type}] ${line}`;
				activeBuildState.logs.push(formatted);
				broker.publish(BUILD_LOG_TOPIC, { logLine: formatted });
			});
		} catch (error) {
			const errLine = `[Error] Failed reading stream: ${error instanceof Error ? error.message : String(error)}`;
			activeBuildState.logs.push(errLine);
			broker.publish(BUILD_LOG_TOPIC, { logLine: errLine });
		}
	}

	streamOutput(childProcess.stdout, 'STDOUT');
	streamOutput(childProcess.stderr, 'STDERR');

	(async () => {
		const exitCode = await childProcess.exited;
		const success = exitCode === 0;

		activeBuildState.isBuilding = false;
		activeBuildState.success = success;
		activeBuildState.finishedAt = Date.now();
		const finishLine = `[Build] Build finished with exit code ${exitCode}. Status: ${success ? 'SUCCESS' : 'FAILED'}`;
		activeBuildState.logs.push(finishLine);

		broker.publish(BUILD_LOG_TOPIC, { logLine: finishLine });
		broker.publish(BUILD_STATUS_TOPIC, { ...activeBuildState });

		console.log(`[BuildService] Build finished. Exit code: ${exitCode}, Success: ${success}`);
	})();
}
