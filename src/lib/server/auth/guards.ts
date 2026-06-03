import { error } from '@sveltejs/kit';

export function requireAuth(user: App.Locals['user']): asserts user is NonNullable<App.Locals['user']> {
	if (!user) throw error(401, 'Не авторизован.');
}

export function requireAdmin(user: App.Locals['user']): asserts user is NonNullable<App.Locals['user']> {
	requireAuth(user);
	if (user.role !== 'admin') throw error(403, 'Только администраторы могут выполнять это действие.');
}

export function canAccessInstance(user: NonNullable<App.Locals['user']>, ownerId: number | null): boolean {
	return user.role === 'admin' || ownerId === user.userId;
}

export function normalizeError(err: unknown, fallback: string): string {
	return err instanceof Error ? err.message : fallback;
}
