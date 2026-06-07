import { isOlcrtcRepoReady } from './repo';

const GIT_DIR = Bun.env.OLCRTC_GIT_DIR || `${process.cwd()}/olcrtc`;

export interface BranchInfo {
	name: string;
	isCurrent: boolean;
	isRemote: boolean;
}

export interface CommitInfo {
	hash: string;
	subject: string;
	author: string;
	date: string;
}

function runGitCommand(args: string[]): {
	success: boolean;
	stdout: string;
	stderr: string;
} {
	try {
		if (!isOlcrtcRepoReady()) {
			return {
				success: false,
				stdout: '',
				stderr: 'Repository is not initialized.'
			};
		}

		const result = Bun.spawnSync(['git', ...args], { cwd: GIT_DIR });
		return {
			success: result.exitCode === 0,
			stdout: result.stdout.toString().trim(),
			stderr: result.stderr.toString().trim()
		};
	} catch (error) {
		return {
			success: false,
			stdout: '',
			stderr: error instanceof Error ? error.message : 'Failed to spawn git process.'
		};
	}
}

export function getBranches(): BranchInfo[] {
	runGitCommand(['fetch', '--all', '--prune']);

	const result = runGitCommand(['branch', '-a']);
	if (!result.success) return [];

	const branches: BranchInfo[] = [];
	const lines = result.stdout.split('\n');

	for (const line of lines) {
		let cleanLine = line.trim();
		if (!cleanLine) continue;

		let isCurrent = false;
		if (cleanLine.startsWith('*')) {
			isCurrent = true;
			cleanLine = cleanLine.substring(1).trim();
		}

		let isRemote = false;
		let name = cleanLine;

		if (cleanLine.startsWith('remotes/origin/')) {
			isRemote = true;
			name = cleanLine.replace('remotes/origin/', '');
		} else if (cleanLine.startsWith('origin/')) {
			isRemote = true;
			name = cleanLine.replace('origin/', '');
		}

		if (name === 'HEAD -> origin/master' || name.includes('->')) continue;

		const existingBranch = branches.find((b) => b.name === name);
		if (!existingBranch) {
			branches.push({ name, isCurrent, isRemote });
		} else if (isCurrent) {
			existingBranch.isCurrent = true;
		}
	}

	return branches;
}

export function checkoutBranch(branchName: string): { success: boolean; error?: string } {
	const checkoutResult = runGitCommand(['checkout', branchName]);
	if (!checkoutResult.success) {
		return {
			success: false,
			error: checkoutResult.stderr || `Не удалось переключиться на ветку "${branchName}"`
		};
	}

	const pullResult = runGitCommand(['pull', 'origin', branchName]);
	if (!pullResult.success) {
		return {
			success: false,
			error: pullResult.stderr || `Не удалось выполнить pull для ветки "${branchName}"`
		};
	}

	return { success: true };
}

export function getCurrentCommit(): CommitInfo | null {
	const result = runGitCommand(['log', '-1', '--format=%H%n%s%n%an%n%ad', '--date=iso']);
	if (!result.success || !result.stdout) return null;

	const [hash, subject, author, date] = result.stdout.split('\n');
	return {
		hash: hash?.trim() || '',
		subject: subject?.trim() || '',
		author: author?.trim() || '',
		date: date?.trim() || ''
	};
}

export function getCurrentBranchName(): string {
	const result = runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD']);
	if (!result.success) return 'master';
	const branchName = result.stdout;
	if (branchName === 'HEAD') {
		const commit = getCurrentCommit();
		return commit ? commit.hash.substring(0, 8) : 'HEAD';
	}
	return branchName;
}
