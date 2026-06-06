import { describe, expect, it } from 'bun:test';
import { getBranches, getCurrentBranchName, getCurrentCommit } from '../src/server/git/client';
import { getBuildStatus, startBuild } from '../src/server/git/build';

describe('Git & Build Service Unit Tests', () => {
	it('should verify local git workspace and retrieve branch metadata', () => {
		const branches = getBranches();
		expect(branches).toBeDefined();
		expect(branches.length).toBeGreaterThan(0);

		// Verify we have a current branch
		const currentBranch = branches.find((b) => b.isCurrent);
		expect(currentBranch).toBeDefined();
		expect(currentBranch?.name).toBeDefined();

		const activeBranchName = getCurrentBranchName();
		expect(activeBranchName).toBeDefined();
		expect(activeBranchName.length).toBeGreaterThan(0);
	});

	it('should read current commit log details successfully', () => {
		const commit = getCurrentCommit();
		expect(commit).not.toBeNull();
		expect(commit?.hash).toBeDefined();
		expect(commit?.hash.length).toBe(40); // Standard SHA-1 hash length
		expect(commit?.subject).toBeDefined();
		expect(commit?.author).toBeDefined();
		expect(commit?.date).toBeDefined();
	});

	it('should manage build process statuses and allow background compilation spawning', async () => {
		// Verify default inactive status
		const initialStatus = getBuildStatus();
		expect(initialStatus.isBuilding).toBe(false);
		expect(initialStatus.success).toBeNull();
		expect(initialStatus.logs.length).toBe(0);

		// Spawn real compilation in background
		startBuild();

		const statusDuringBuild = getBuildStatus();
		expect(statusDuringBuild.isBuilding).toBe(true);
		expect(statusDuringBuild.branch).toBe(getCurrentBranchName());
		expect(statusDuringBuild.startedAt).toBeGreaterThan(0);
		expect(statusDuringBuild.logs.length).toBeGreaterThan(0);

		// Wait 1 second and verify it's still running or finished, capturing logs
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const statusAfterASecond = getBuildStatus();
		expect(statusAfterASecond.logs.length).toBeGreaterThan(0);
		console.log(
			`[TestLogs] Captured ${statusAfterASecond.logs.length} build log lines during test.`
		);
	});
});
