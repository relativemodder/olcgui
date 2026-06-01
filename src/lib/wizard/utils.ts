export interface WizardConfig {
	provider: 'jitsi' | 'wbstream' | 'telemost';
	roomUrl: string;
	cryptoKey: string;
	transport: 'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel';
	dns: string;
	socksHost: string;
	socksPort: number;
	socksUser?: string;
	socksPass?: string;
	debug?: boolean;
}

/**
 * Generates a cryptographically secure 32-byte (64-character) hex encryption key.
 * Works universally on both client and server (Node.js 19+ / Bun).
 */
export function generateCryptoKey(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Extracts the appropriate room identification parameter from a full conference URL based on the provider requirements.
 */
export function parseRoomUrl(url: string, provider: 'jitsi' | 'wbstream' | 'telemost'): string {
	const trimmed = url.trim();
	if (provider === 'wbstream') {
		const match = trimmed.match(/stream\.wb\.ru\/room\/([a-zA-Z0-9_-]+)/);
		if (match) return match[1];
		return trimmed;
	}
	if (provider === 'telemost') {
		const match = trimmed.match(/telemost\.yandex\.ru\/j\/([a-zA-Z0-9_-]+)/);
		if (match) return match[1];
		return trimmed;
	}
	return trimmed;
}

/**
 * Generates the formal config YAML content for both Server (srv) and Client (cnc) configurations.
 */
export function generateYaml(config: WizardConfig, mode: 'srv' | 'cnc'): string {
	const lines: string[] = [];
	lines.push(`# olcrtc ${mode === 'srv' ? 'Server' : 'Client'} Config`);
	lines.push(`mode: ${mode}`);
	lines.push(`auth:`);
	lines.push(` provider: ${config.provider}`);
	lines.push(`room:`);
	lines.push(` id: "${parseRoomUrl(config.roomUrl, config.provider)}"`);
	lines.push(`crypto:`);
	lines.push(` key: "${config.cryptoKey}"`);
	lines.push(`net:`);
	lines.push(` transport: ${config.transport}`);
	lines.push(` dns: "${config.dns}"`);

	if (mode === 'cnc') {
		lines.push(`socks:`);
		lines.push(` host: "${config.socksHost}"`);
		lines.push(` port: ${config.socksPort}`);
		if (config.socksUser?.trim()) {
			lines.push(` user: "${config.socksUser.trim()}"`);
		}
		if (config.socksPass?.trim()) {
			lines.push(` pass: "${config.socksPass.trim()}"`);
		}
	}

	lines.push(`data: data`);
	if (config.debug) {
		lines.push(`debug: true`);
	}

	return lines.join('\n');
}

/**
 * Generates an olcrtc:// URI scheme string from configurations.
 */
export function generateOlcrtcUri(
	provider: 'jitsi' | 'wbstream' | 'telemost',
	transport: string,
	roomUrl: string,
	cryptoKey: string,
	name: string
): string {
	const roomId = parseRoomUrl(roomUrl, provider);
	let transportStr = transport;
	if (transport === 'vp8channel') {
		transportStr += '<vp8-fps=60&vp8-batch=25>';
	}
	return `olcrtc://${provider}?${transportStr}@${roomId}#${cryptoKey}$${name}`;
}

export interface ParsedOlcrtcUri {
	provider: 'jitsi' | 'wbstream' | 'telemost';
	transport: 'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel';
	roomId: string;
	cryptoKey: string;
	name: string;
}

/**
 * Parses an olcrtc:// URI scheme string and populates the config parameters.
 */
export function parseOlcrtcUri(uri: string): ParsedOlcrtcUri {
	const trimmed = uri.trim();
	if (!trimmed.startsWith('olcrtc://')) {
		throw new Error('Ссылка должна начинаться с olcrtc://');
	}

	const providerPart = trimmed.slice(9).split('?')[0];
	const afterProvider = trimmed.slice(9 + providerPart.length + 1);
	const transportAndParams = afterProvider.split('@')[0];
	const afterTransport = afterProvider.slice(transportAndParams.length + 1);
	const roomId = afterTransport.split('#')[0];
	const afterRoomId = afterTransport.slice(roomId.length + 1);
	const cryptoKey = afterRoomId.split('$')[0];
	const nameEncoded = afterRoomId.slice(cryptoKey.length + 1);
	const name = nameEncoded || 'Импортированный туннель';

	if (!['jitsi', 'wbstream', 'telemost'].includes(providerPart)) {
		throw new Error(`Неподдерживаемый провайдер: ${providerPart}`);
	}

	let cleanTransport = transportAndParams;
	if (transportAndParams.includes('<')) {
		cleanTransport = transportAndParams.split('<')[0];
	}

	return {
		provider: providerPart as 'jitsi' | 'wbstream' | 'telemost',
		transport: cleanTransport as 'datachannel' | 'vp8channel' | 'seichannel' | 'videochannel',
		roomId,
		cryptoKey,
		name
	};
}

export function resolveImportUrl(parsed: ParsedOlcrtcUri): string {
	if (parsed.provider === 'jitsi') {
		if (parsed.roomId.startsWith('http://') || parsed.roomId.startsWith('https://')) {
			return parsed.roomId;
		}
		return `https://meet1.arbitr.ru/${parsed.roomId}`;
	} else if (parsed.provider === 'wbstream') {
		return `https://stream.wb.ru/room/${parsed.roomId}`;
	} else if (parsed.provider === 'telemost') {
		return `https://telemost.yandex.ru/j/${parsed.roomId}`;
	}
	return parsed.roomId;
}

export function replaceJitsiServer(roomUrl: string, server: string): string {
	let roomName = 'myroom';
	try {
		const url = new URL(roomUrl);
		const path = url.pathname.slice(1);
		if (path) roomName = path;
	} catch {
		const parts = roomUrl.split('/');
		const last = parts[parts.length - 1];
		if (last && !last.includes('.')) roomName = last;
	}
	return `https://${server}/${roomName}`;
}
