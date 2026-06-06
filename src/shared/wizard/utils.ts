import type { Mode, Provider, Transport } from './constants';

export interface WizardConfig {
	provider: Provider;
	roomUrl: string;
	cryptoKey: string;
	transport: Transport;
	dns: string;
	socksHost: string;
	socksPort: number;
	socksUser?: string;
	socksPass?: string;
	debug?: boolean;
}

export function generateCryptoKey(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function parseRoomUrl(url: string, provider: Provider): string {
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

function escapeYamlValue(value: string): string {
	return value
		.replaceAll('\\', '\\\\')
		.replaceAll('"', '\\"')
		.replaceAll('\n', '\\n')
		.replaceAll('\r', '');
}

export function generateYaml(config: WizardConfig, mode: Mode): string {
	const lines: string[] = [];
	lines.push(`# olcrtc ${mode === 'srv' ? 'Server' : 'Client'} Config`);
	lines.push(`mode: ${mode}`);
	lines.push(`auth:`);
	lines.push(` provider: ${config.provider}`);
	lines.push(`room:`);
	lines.push(` id: "${escapeYamlValue(parseRoomUrl(config.roomUrl, config.provider))}"`);
	lines.push(`crypto:`);
	lines.push(` key: "${escapeYamlValue(config.cryptoKey)}"`);
	lines.push(`net:`);
	lines.push(` transport: ${config.transport}`);
	lines.push(` dns: "${escapeYamlValue(config.dns)}"`);

	if (mode === 'cnc') {
		lines.push(`socks:`);
		lines.push(` host: "${escapeYamlValue(config.socksHost)}"`);
		lines.push(` port: ${config.socksPort}`);
		if (config.socksUser?.trim()) {
			lines.push(` user: "${escapeYamlValue(config.socksUser.trim())}"`);
		}
		if (config.socksPass?.trim()) {
			lines.push(` pass: "${escapeYamlValue(config.socksPass.trim())}"`);
		}
	}

	lines.push(`data: data`);
	if (config.debug) {
		lines.push(`debug: true`);
	}

	return lines.join('\n');
}

export function generateOlcrtcUri(
	provider: Provider,
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
	provider: Provider;
	transport: Transport;
	roomId: string;
	cryptoKey: string;
	name: string;
}

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
		provider: providerPart as Provider,
		transport: cleanTransport as Transport,
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
