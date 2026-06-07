import type { Mode, Provider, Transport } from '../wizard/constants';
import type { UserRole } from './types';

export interface LoginRequest {
	username: string;
	password: string;
}

export interface CreateInstanceRequest {
	name: string;
	mode: Mode;
	provider: Provider;
	roomUrl: string;
	cryptoKey: string;
	transport: Transport;
	socksPort?: number;
	restartInterval?: number | null;
	userId?: number | null;
	dns?: string;
	socksHost?: string;
	socksUser?: string | null;
	socksPass?: string | null;
	debug?: boolean;
}

export type UpdateInstanceRequest = CreateInstanceRequest;

export interface CreateUserRequest {
	username: string;
	password: string;
	confirmPassword: string;
	role: UserRole;
}

export interface UpdateUserRequest {
	username: string;
	role: UserRole;
	password?: string;
	confirmPassword?: string;
}

export interface UpdateSelfRequest {
	username: string;
	currentPassword: string;
}

export interface UpdateSelfPasswordRequest {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export interface CheckoutBranchRequest {
	name: string;
}
