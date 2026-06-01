import { getCurrentBranchName } from './client';
import { join } from 'path';
import { env } from '$env/dynamic/private';

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

const BUILD_DIR = env.OLCRTC_BUILD_DIR || join(process.cwd(), 'olcrtc');

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

	console.log(`[BuildService] Initiating build on branch "${branch}"`);

	const mageCmd = env.MAGE_CMD || '~/go/bin/mage';
	const childProcess = Bun.spawn(['bash', '-c', `${mageCmd} build`], {
		cwd: BUILD_DIR,
		stdout: 'pipe',
		stderr: 'pipe'
	});

	async function streamOutput(stream: ReadableStream<Uint8Array>, type: 'STDOUT' | 'STDERR') {
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
						activeBuildState.logs.push(`[${type}] ${line}`);
					}
				}
			}
		} catch (error) {
			activeBuildState.logs.push(
				`[Error] Failed reading stream: ${error instanceof Error ? error.message : String(error)}`
			);
		} finally {
			reader.releaseLock();
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
		activeBuildState.logs.push(
			`[Build] Build finished with exit code ${exitCode}. Status: ${success ? 'SUCCESS' : 'FAILED'}`
		);

		console.log(`[BuildService] Build finished. Exit code: ${exitCode}, Success: ${success}`);
	})();
}
