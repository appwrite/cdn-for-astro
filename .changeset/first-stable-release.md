---
'@appwrite.io/cdn-for-astro': major
---

First stable release. `cacheAppwrite()` wires Astro route caching to the Appwrite Sites CDN: a route's cache intent becomes an `Appwrite-CDN-Cache-Control` directive with its tags in `Appwrite-CDN-Cache-Key`, `cache.invalidate()` purges by path or tag through the Appwrite proxy API, and a route that declares no cache intent is sent as `no-store` so the CDN's default TTL cannot cache it. Endpoint, project ID, API key and domain are read from the Appwrite Sites runtime, so `cache: { provider: cacheAppwrite() }` needs no configuration to deploy.
