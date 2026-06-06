export interface EventMessage {
	topic: string;
	data: unknown;
}

type EventHandler = (msg: EventMessage) => void;

export class EventBroker {
	private handlers = new Set<EventHandler>();

	subscribe(handler: EventHandler): () => void {
		this.handlers.add(handler);
		return () => {
			this.handlers.delete(handler);
		};
	}

	publish(topic: string, data: unknown): void {
		const msg: EventMessage = { topic, data };
		for (const handler of this.handlers) {
			handler(msg);
		}
	}
}

export const broker = new EventBroker();
