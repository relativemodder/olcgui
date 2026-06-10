import type { Database } from 'bun:sqlite';
import type { MessageContext } from 'vk-io';
import { authKeyboard, flowKeyboard } from '../keyboard';
import { createAuthedApiClient } from '../config';

export type FlowStepResult = string | void;

export function isCancelCommand(context: {
	messagePayload?: Record<string, unknown> | null;
}): boolean {
	return context.messagePayload?.command === '/cancel';
}

export function parseBooleanChoice(
	payload: Record<string, unknown> | null | undefined,
	field: string
): boolean | null {
	if (!payload || typeof payload[field] !== 'boolean') return null;
	return payload[field] as boolean;
}

export async function sendFlowCancelled(
	context: MessageContext,
	message: string
): Promise<FlowStepResult> {
	await context.send(message, { keyboard: authKeyboard() });
}

export async function repeatFlowStep(
	context: MessageContext,
	message: string,
	step: string
): Promise<string> {
	await context.send(message, { keyboard: flowKeyboard() });
	return step;
}

export async function ensureAuthedClient(
	db: Database,
	context: MessageContext,
	message = 'Ошибка авторизации.'
) {
	const client = createAuthedApiClient(db, context.senderId);
	if (client) return client;

	await context.send(message, { keyboard: authKeyboard() });
	return null;
}
