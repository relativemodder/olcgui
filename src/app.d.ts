declare global {
	namespace App {
		interface Locals {
			user: {
				userId: number;
				username: string;
				role: 'admin' | 'user';
			} | null;
			setupNeeded: boolean;
		}
	}
}

export {};
