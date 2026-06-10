import type { InstanceDto, SystemStatsDto } from '../shared/api/types';

const INSTANCE_STATUS_LABELS: Record<string, string> = {
	running: 'работает',
	stopped: 'остановлен',
	restarting: 'перезапускается',
	error: 'ошибка'
};

const INSTANCE_MODE_LABELS: Record<string, string> = {
	srv: 'Сервер',
	cnc: 'Клиент'
};

export function formatSystemStats(stats: SystemStatsDto): string {
	return [
		'Статус системы:',
		`CPU: ${stats.cpuPercent.toFixed(1)}%`,
		`RAM: ${(stats.memoryUsed / 1024 / 1024).toFixed(1)}/${(stats.memoryTotal / 1024 / 1024).toFixed(1)} MB`,
		`Сеть: ${(stats.networkRxSec / 1024).toFixed(1)} KB/s входящий / ${(stats.networkTxSec / 1024).toFixed(1)} KB/s исходящий`
	].join('\n');
}

export function formatInstanceList(instances: InstanceDto[]): string {
	const lines = instances.map(
		(inst, index) =>
			`${index + 1}. ${inst.name} (${inst.status === 'running' ? 'работает' : 'остановлен'})`
	);

	return ['Инстансы:', ...lines].join('\n');
}

export function formatInstanceInfo(inst: InstanceDto): string {
	return [
		`${inst.name}`,
		``,
		`Статус: ${INSTANCE_STATUS_LABELS[inst.status] || inst.status}`,
		`Режим: ${INSTANCE_MODE_LABELS[inst.mode] || inst.mode}`,
		`Провайдер: ${inst.provider}`,
		`Транспорт: ${inst.transport}`,
		`Комната: ${inst.roomUrl}`,
		...(inst.socksPort ? [`SOCKS5: порт ${inst.socksPort}`] : []),
		...(inst.autoRestart ? [`Авторестарт: вкл`] : [`Авторестарт: выкл`]),
		...(inst.restartInterval ? [`Интервал: ${inst.restartInterval} мин`] : [])
	].join('\n');
}
