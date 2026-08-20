import { cacheAppwrite } from '@appwrite.io/cdn-for-astro';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',

	// Appwrite Sites runs Astro through the Node adapter. This package does not
	// replace it; it only supplies the cache provider next to it.
	adapter: node({ mode: 'standalone' }),

	cache: {
		// Everything the provider needs on Appwrite Sites — endpoint, project ID,
		// API key, and the domain to purge — is read from the runtime and the
		// incoming request, so there is nothing to configure here.
		provider: cacheAppwrite(),
	},

	// Cache rules declared per route pattern. `/products/1` is cached at the edge
	// for an hour and tagged, so a single purge can drop every product page.
	routeRules: {
		'/products/[...slug]': { maxAge: 3600, swr: 60, tags: ['products'] },
	},
});
