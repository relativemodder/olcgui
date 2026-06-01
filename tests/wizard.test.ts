import { describe, expect, it } from 'bun:test';
import {
	generateCryptoKey,
	parseRoomUrl,
	generateYaml,
	generateOlcrtcUri,
	parseOlcrtcUri,
	type WizardConfig
} from '../src/lib/wizard/utils';
import { PROVIDER_CONFIG } from '../src/lib/wizard/constants';

describe('Wizard & Configuration Core Unit Tests', () => {
	it('should generate a cryptographically secure 64-character hex crypto key', () => {
		const key1 = generateCryptoKey();
		const key2 = generateCryptoKey();

		expect(key1).toBeDefined();
		expect(key1).toHaveLength(64);
		expect(key2).toHaveLength(64);
		expect(key1).not.toBe(key2); // Should be unique
		expect(/^[a-f0-9]{64}$/.test(key1)).toBe(true); // Should be valid hex
	});

	it('should extract correct room parameters from different conference links', () => {
		// Jitsi - keeps the full URL
		const jitsiUrl = 'https://meet1.arbitr.ru/secure-room-123';
		expect(parseRoomUrl(jitsiUrl, 'jitsi')).toBe(jitsiUrl);

		// WbStream - extracts the room ID
		const wbstreamUrl = 'https://stream.wb.ru/room/wb-tunnel-room-99';
		expect(parseRoomUrl(wbstreamUrl, 'wbstream')).toBe('wb-tunnel-room-99');
		expect(parseRoomUrl('wb-tunnel-room-99', 'wbstream')).toBe('wb-tunnel-room-99'); // fallback

		// Telemost - extracts the session ID
		const telemostUrl = 'https://telemost.yandex.ru/j/987654321012';
		expect(parseRoomUrl(telemostUrl, 'telemost')).toBe('987654321012');
		expect(parseRoomUrl('987654321012', 'telemost')).toBe('987654321012'); // fallback
	});

	it('should fetch correct defaults for each provider', () => {
		const jitsiDefaults = PROVIDER_CONFIG['jitsi'];
		expect(jitsiDefaults.transport).toBe('datachannel');
		expect(jitsiDefaults.socksPort).toBe(8808);

		const wbstreamDefaults = PROVIDER_CONFIG['wbstream'];
		expect(wbstreamDefaults.transport).toBe('vp8channel');
		expect(wbstreamDefaults.socksPort).toBe(8809);

		const telemostDefaults = PROVIDER_CONFIG['telemost'];
		expect(telemostDefaults.transport).toBe('videochannel');
		expect(telemostDefaults.socksPort).toBe(8810);
	});

	it('should format YAML profiles for client and server configurations correctly', () => {
		const mockConfig: WizardConfig = {
			provider: 'jitsi',
			roomUrl: 'https://meet1.arbitr.ru/myroom',
			cryptoKey: 'd823fa01cb3e0609b67322f7cf984c4ee2e4ce2e294936fc24ef38c9e59f4799',
			transport: 'datachannel',
			dns: '1.1.1.1:53',
			socksHost: '127.0.0.1',
			socksPort: 8808,
			socksUser: 'user123',
			socksPass: 'pass456',
			debug: true
		};

		// 1. Test Client Config
		const clientYaml = generateYaml(mockConfig, 'cnc');
		expect(clientYaml).toContain('mode: cnc');
		expect(clientYaml).toContain('provider: jitsi');
		expect(clientYaml).toContain('id: "https://meet1.arbitr.ru/myroom"');
		expect(clientYaml).toContain(
			'key: "d823fa01cb3e0609b67322f7cf984c4ee2e4ce2e294936fc24ef38c9e59f4799"'
		);
		expect(clientYaml).toContain('transport: datachannel');
		expect(clientYaml).toContain('dns: "1.1.1.1:53"');
		expect(clientYaml).toContain('host: "127.0.0.1"');
		expect(clientYaml).toContain('port: 8808');
		expect(clientYaml).toContain('user: "user123"');
		expect(clientYaml).toContain('pass: "pass456"');
		expect(clientYaml).toContain('debug: true');

		// 2. Test Server Config
		const serverYaml = generateYaml(mockConfig, 'srv');
		expect(serverYaml).toContain('mode: srv');
		expect(serverYaml).not.toContain('socks:'); // Server configuration does not hold socks info
		expect(serverYaml).not.toContain('host:');
		expect(serverYaml).not.toContain('user:');
	});

	it('should generate a valid olcrtc:// URI scheme format correctly', () => {
		const provider = 'telemost';
		const transport = 'vp8channel';
		const roomUrl = 'https://telemost.yandex.ru/j/38044046793346';
		const cryptoKey = '5cdbeb49123713eefe75eafac616cb8707eb464bf5d85a4012442673d0d5704f';
		const name = 'Relativeeeeee';

		const uri = generateOlcrtcUri(provider, transport, roomUrl, cryptoKey, name);
		expect(uri).toBe(
			'olcrtc://telemost?vp8channel<vp8-fps=60&vp8-batch=25>@38044046793346#5cdbeb49123713eefe75eafac616cb8707eb464bf5d85a4012442673d0d5704f$Relativeeeeee'
		);
	});

	it('should parse an olcrtc:// URI scheme string successfully', () => {
		const rawUri =
			'olcrtc://telemost?vp8channel<vp8-fps=60&vp8-batch=25>@38044046793346#5cdbeb49123713eefe75eafac616cb8707eb464bf5d85a4012442673d0d5704f$Relativeeeeee';
		const parsed = parseOlcrtcUri(rawUri);

		expect(parsed.provider).toBe('telemost');
		expect(parsed.transport).toBe('vp8channel');
		expect(parsed.roomId).toBe('38044046793346');
		expect(parsed.cryptoKey).toBe(
			'5cdbeb49123713eefe75eafac616cb8707eb464bf5d85a4012442673d0d5704f'
		);
		expect(parsed.name).toBe('Relativeeeeee');
	});
});
