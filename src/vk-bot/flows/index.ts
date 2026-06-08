import type { MessageContext } from 'vk-io';
import { getSession, clearSession } from '../session';

export interface Flow {
	name: string;
	start: (context: MessageContext) => Promise<string | void>;
	steps: Record<
		string,
		(context: MessageContext, data: Record<string, unknown>) => Promise<string | void>
	>;
}

const flows = new Map<string, Flow>();

export function registerFlow(flow: Flow): void {
	flows.set(flow.name, flow);
}

export function getFlow(name: string): Flow | undefined {
	return flows.get(name);
}

export async function routeFlow(context: MessageContext): Promise<boolean> {
	const session = getSession(context.senderId);
	if (!session) return false;

	const flow = flows.get(session.flow);
	if (!flow) {
		clearSession(context.senderId);
		return false;
	}

	const handler = flow.steps[session.data.step as string];
	if (!handler) {
		clearSession(context.senderId);
		return false;
	}

	const next = await handler(context, session.data);

	if (next) {
		session.data.step = next;
	} else {
		clearSession(context.senderId);
	}

	return true;
}
