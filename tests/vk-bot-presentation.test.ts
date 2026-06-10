import { describe, expect, it } from 'bun:test';
import type { InstanceDto, SystemStatsDto } from '../src/shared/api/types';
import {
	formatInstanceInfo,
	formatInstanceList,
	formatSystemStats
} from '../src/vk-bot/presentation';

const baseInstance: InstanceDto = {
	id: 7,
	userId: 1,
	name: 'Demo Tunnel',
	mode: 'srv',
	provider: 'jitsi',
	roomUrl: 'https://meet.cryptopro.ru/demo-room',
	cryptoKey: 'secret',
	transport: 'datachannel',
	dns: '8.8.8.8:53',
	socksHost: '127.0.0.1',
	socksPort: null,
	socksUser: null,
	socksPass: null,
	debug: false,
	autoRestart: true,
	restartInterval: 5,
	status: 'running',
	branch: 'main'
};

describe('VK bot presentation helpers', () => {
	it('formats system stats text', () => {
		const stats: SystemStatsDto = {
			cpuPercent: 12.34,
			iowaitPercent: 0,
			memoryTotal: 1024 * 1024 * 1024,
			memoryUsed: 512 * 1024 * 1024,
			networkRxSec: 2048,
			networkTxSec: 4096
		};

		const message = formatSystemStats(stats);
		expect(message).toContain('Статус системы:');
		expect(message).toContain('CPU: 12.3%');
		expect(message).toContain('RAM: 512.0/1024.0 MB');
		expect(message).toContain('Сеть: 2.0 KB/s входящий / 4.0 KB/s исходящий');
	});

	it('formats instance list text', () => {
		const message = formatInstanceList([
			baseInstance,
			{ ...baseInstance, id: 8, name: 'Stopped Tunnel', status: 'stopped' }
		]);

		expect(message).toBe(
			'Инстансы:\n1. Demo Tunnel — работает\n2. Stopped Tunnel — остановлен'
		);
	});

	it('formats instance info text', () => {
		const message = formatInstanceInfo(baseInstance);

		expect(message).toContain('Demo Tunnel');
		expect(message).toContain('Статус: работает');
		expect(message).toContain('Режим: Сервер');
		expect(message).toContain('Авторестарт: вкл');
		expect(message).toContain('Интервал: 5 мин');
	});
});
