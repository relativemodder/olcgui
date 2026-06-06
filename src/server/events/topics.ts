export function instanceStatusTopic(id: number): string {
	return `instance:${id}:status`;
}

export function instanceLogTopic(id: number): string {
	return `instance:${id}:log`;
}

export const BUILD_STATUS_TOPIC = 'build:status';
export const BUILD_LOG_TOPIC = 'build:log';
export const REPO_STATUS_TOPIC = 'repo:status';
