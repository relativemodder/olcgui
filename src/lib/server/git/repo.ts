import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from '$env/dynamic/private';

const DEFAULT_REPO_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'..',
	'..',
	'..',
	'olcrtc'
);
const GIT_DIR = env.OLCRTC_GIT_DIR || DEFAULT_REPO_DIR;
const GIT_REMOTE_URL = env.OLCRTC_GIT_REMOTE_URL || 'https://github.com/openlibrecommunity/olcrtc';

let ensurePromise: Promise<void> | null = null;

let repoSyncing = false;

export function getRepoSyncing(): boolean {
	return repoSyncing;
}

function isGitRepoDir(dir: string): boolean {
	return existsSync(join(dir, '.git'));
}

export function isOlcrtcRepoReady(): boolean {
	return existsSync(GIT_DIR) && isGitRepoDir(GIT_DIR);
}

export async function readStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
	const merged = new Uint8Array(totalLen);
	let offset = 0;
	for (const c of chunks) {
		merged.set(c, offset);
		offset += c.length;
	}
	return new TextDecoder().decode(merged);
}

async function run(cmd: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
	const result = Bun.spawn(cmd, { cwd, stdout: 'pipe', stderr: 'pipe' });

	const stdout = result.stdout ? await readStreamToString(result.stdout) : '';
	const stderr = result.stderr ? await readStreamToString(result.stderr) : '';

	const exitCode = await result.exited;
	if (exitCode !== 0) {
		throw new Error(
			`[GitRepo] Command failed (${cmd.join(' ')}). exitCode=${exitCode}. stderr=${stderr.trim()}`
		);
	}

	return { stdout: stdout.trim(), stderr: stderr.trim() };
}

export function ensureOlcrtcRepoSync(): void {
	void ensureOlcrtcRepo();
}

export async function ensureOlcrtcRepo(): Promise<void> {
	if (ensurePromise) return ensurePromise;

	ensurePromise = (async () => {
		repoSyncing = true;
		try {
			if (existsSync(GIT_DIR)) {
				if (!isGitRepoDir(GIT_DIR)) {
					throw new Error(`[GitRepo] Directory exists but is not a git repo: ${GIT_DIR}`);
				}
			}

			if (!existsSync(GIT_DIR) || !isGitRepoDir(GIT_DIR)) {
				const parentDir = join(GIT_DIR, '..');
				if (!existsSync(parentDir)) {
					throw new Error(
						`[GitRepo] Parent directory does not exist for OLCRTC_GIT_DIR: ${parentDir}`
					);
				}

				console.log(`[GitRepo] Cloning olcrtc repo into "${GIT_DIR}" from "${GIT_REMOTE_URL}"...`);

				const cloneResult = Bun.spawn(['git', 'clone', GIT_REMOTE_URL, GIT_DIR], {
					cwd: process.cwd(),
					stdout: 'pipe',
					stderr: 'pipe'
				});

				const cloneStdout = cloneResult.stdout ? await readStreamToString(cloneResult.stdout) : '';
				const cloneStderr = cloneResult.stderr ? await readStreamToString(cloneResult.stderr) : '';

				const exitCode = await cloneResult.exited;
				if (exitCode !== 0) {
					throw new Error(
						`[GitRepo] git clone failed. exitCode=${exitCode}. stderr=${cloneStderr.trim() || '(empty)'} stdout=${cloneStdout.trim() || '(empty)'}`
					);
				}

				console.log('[GitRepo] Clone completed.');
			}

			console.log(`[GitRepo] Fetching updates for "${GIT_DIR}"...`);
			await run(['git', 'fetch', '--all', '--prune'], GIT_DIR);

			let branch = 'master';
			try {
				const revParse = Bun.spawn(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], {
					cwd: GIT_DIR,
					stdout: 'pipe',
					stderr: 'pipe'
				});

				const revStdout = revParse.stdout ? await readStreamToString(revParse.stdout) : '';
				revParse.stderr
					?.getReader()
					.cancel()
					.catch(() => {});
				const revExit = await revParse.exited;

				if (revExit === 0) {
					const parsed = revStdout.trim();
					if (parsed && parsed !== 'HEAD') branch = parsed;
				}
			} catch {
				// fallback to master
			}

			console.log(`[GitRepo] Pulling branch "${branch}"...`);
			try {
				await run(['git', 'pull', 'origin', branch], GIT_DIR);
			} catch (e) {
				console.warn(`[GitRepo] git pull failed for branch "${branch}". Continuing.`, e);
			}
		} finally {
			repoSyncing = false;
		}
	})();

	return ensurePromise.finally(() => {
		ensurePromise = null;
	});
}
