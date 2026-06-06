import type { Mode, Provider, Transport } from '../wizard/constants';

export type UserRole = 'admin' | 'user';
export type InstanceStatus = 'stopped' | 'running' | 'restarting' | 'error';
export type TimestampLike = string | Date;

export interface ApiUser {
	userId: number;
	username: string;
	role: UserRole;
}

export interface UserListItem {
	id: number;
	username: string;
	role: UserRole;
	createdAt?: TimestampLike;
}

export interface InstanceDto {
	id: number;
	userId: number | null;
	name: string;
	mode: Mode;
	provider: Provider;
	roomUrl: string;
	cryptoKey: string;
	transport: Transport;
	dns: string;
	socksHost: string;
	socksPort: number | null;
	socksUser: string | null;
	socksPass: string | null;
	debug: boolean;
	autoRestart: boolean;
	restartInterval: number | null;
	status: InstanceStatus;
	branch: string;
	createdAt?: TimestampLike;
}

export interface BranchInfoDto {
	name: string;
	isCurrent: boolean;
	isRemote: boolean;
}

export interface CommitInfoDto {
	hash: string;
	subject: string;
	author: string;
	date: string;
}

export interface AuthMeResponse {
	user: ApiUser | null;
}

export interface SetupStatusResponse {
	setupNeeded: boolean;
}

export interface SetupCreateResponse {
	token: string;
	user: ApiUser;
}

export interface InstancesResponse {
	instances: InstanceDto[];
}

export interface InstanceResponse {
	instance: InstanceDto;
}

export interface UsersResponse {
	allUsers: UserListItem[];
	currentUser: ApiUser;
}

export interface RepoSyncResponse {
	repoSyncing: boolean;
}

export interface RepoInfoResponse {
	branches: BranchInfoDto[];
	currentBranchName: string;
	currentCommit: CommitInfoDto | null;
}

export interface BuildStatusResponse {
	isBuilding: boolean;
	logs: string[];
	success: boolean | null;
	startedAt: number | null;
	finishedAt: number | null;
	branch: string | null;
}

export interface UploadStatusResponse {
	status: 'writing' | 'validating' | 'success' | 'error';
	message: string;
	fileName: string;
}

export interface UploadStartResponse {
	uploadId: string;
}

export interface SystemStatsDto {
	cpuPercent: number;
	iowaitPercent: number;
	memoryTotal: number;
	memoryUsed: number;
	networkRxSec: number;
	networkTxSec: number;
}
