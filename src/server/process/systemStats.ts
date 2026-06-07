const PROC_DIR = Bun.env.HOST_PROC || '/proc';

interface CpuReading {
	user: number;
	nice: number;
	system: number;
	idle: number;
	iowait: number;
	irq: number;
	softirq: number;
	steal: number;
	guest: number;
	guest_nice: number;
	total: number;
	timestamp: number;
}

interface NetworkReading {
	rxBytes: number;
	txBytes: number;
	timestamp: number;
}

let lastCpuReading: CpuReading | null = null;
let lastNetworkReading: NetworkReading | null = null;

export async function getSystemStats() {
	const stats = {
		cpuPercent: 0,
		iowaitPercent: 0,
		memoryTotal: 0,
		memoryUsed: 0,
		networkRxSec: 0,
		networkTxSec: 0
	};

	try {
		// CPU Reading
		const statContent = await Bun.file(`${PROC_DIR}/stat`).text();
		const cpuLine = statContent.split('\n').find((line) => line.startsWith('cpu '));
		if (cpuLine) {
			const parts = cpuLine.trim().split(/\s+/).slice(1).map(Number);
			const [user, nice, system, idle, iowait, irq, softirq, steal, guest, guest_nice] = parts;
			const total = parts.reduce((acc, val) => acc + val, 0);
			const currentCpu: CpuReading = {
				user,
				nice,
				system,
				idle,
				iowait,
				irq,
				softirq,
				steal,
				guest,
				guest_nice,
				total,
				timestamp: Date.now()
			};

			if (lastCpuReading) {
				const deltaTotal = currentCpu.total - lastCpuReading.total;
				const deltaIdle = currentCpu.idle - lastCpuReading.idle;
				const deltaIowait = currentCpu.iowait - lastCpuReading.iowait;

				if (deltaTotal > 0) {
					stats.cpuPercent = Number((((deltaTotal - deltaIdle) / deltaTotal) * 100).toFixed(1));
					stats.iowaitPercent = Number(((deltaIowait / deltaTotal) * 100).toFixed(1));
				}
			}
			lastCpuReading = currentCpu;
		}
	} catch (e) {
		console.error('Failed to read CPU stats:', e);
	}

	try {
		// Memory Reading
		const meminfoContent = await Bun.file(`${PROC_DIR}/meminfo`).text();
		let memTotal = 0;
		let memAvailable = 0;
		for (const line of meminfoContent.split('\n')) {
			if (line.startsWith('MemTotal:')) {
				memTotal = parseInt(line.replace(/\D/g, ''), 10) * 1024; // Convert kB to bytes
			} else if (line.startsWith('MemAvailable:')) {
				memAvailable = parseInt(line.replace(/\D/g, ''), 10) * 1024;
			}
		}
		if (memTotal > 0) {
			stats.memoryTotal = memTotal;
			stats.memoryUsed = memTotal - memAvailable;
		}
	} catch (e) {
		console.error('Failed to read Memory stats:', e);
	}

	try {
		// Network Reading
		const netDevContent = await Bun.file(`${PROC_DIR}/net/dev`).text();
		const lines = netDevContent.split('\n').slice(2); // Skip headers
		let totalRx = 0;
		let totalTx = 0;

		for (const line of lines) {
			if (!line.trim()) continue;
			const parts = line.trim().split(/\s+/);
			const iface = parts[0];
			if (iface.startsWith('lo:')) continue; // Skip loopback

			totalRx += parseInt(parts[1], 10) || 0;
			totalTx += parseInt(parts[9], 10) || 0;
		}

		const currentNet: NetworkReading = {
			rxBytes: totalRx,
			txBytes: totalTx,
			timestamp: Date.now()
		};

		if (lastNetworkReading) {
			const timeDeltaSec = (currentNet.timestamp - lastNetworkReading.timestamp) / 1000;
			if (timeDeltaSec > 0) {
				stats.networkRxSec = Math.max(
					0,
					(currentNet.rxBytes - lastNetworkReading.rxBytes) / timeDeltaSec
				);
				stats.networkTxSec = Math.max(
					0,
					(currentNet.txBytes - lastNetworkReading.txBytes) / timeDeltaSec
				);
			}
		}
		lastNetworkReading = currentNet;
	} catch (e) {
		console.error('Failed to read Network stats:', e);
	}

	return stats;
}
