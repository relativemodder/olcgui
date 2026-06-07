export async function readStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
	const merged = new Uint8Array(totalLen);
	let offset = 0;
	for (const c of chunks) {
		merged.set(c, offset);
		offset += c.length;
	}
	return new TextDecoder().decode(merged);
}

export async function forEachLine(
	stream: ReadableStream<Uint8Array>,
	onLine: (line: string) => void | Promise<void>
): Promise<void> {
	const reader = stream.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';
			for (const line of lines) {
				if (line.trim()) {
					await onLine(line.trim());
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}
