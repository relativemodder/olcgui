import { json } from '@sveltejs/kit';
import { getSystemStats } from '$lib/server/process/systemStats';

export async function GET() {
	const stats = await getSystemStats();
	return json(stats);
}
