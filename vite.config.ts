import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: process.env.VITE_HOST || process.env.HOST,
		proxy: process.env.API_BACKEND_URL
			? {
					'/api': {
						target: process.env.API_BACKEND_URL,
						changeOrigin: true
					}
				}
			: undefined,
		watch: {
			usePolling: process.env.VITE_USE_POLLING === 'true',
			interval: process.env.VITE_USE_POLLING === 'true' ? 100 : undefined,
			ignored: ['**/*.db', '**/*.db-wal', '**/*.db-shm', '**/data/**', '**/olcrtc/**']
		}
	}
});
