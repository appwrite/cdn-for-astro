# @appwrite.io/cdn-for-astro

## 1.0.0

### Major Changes

- 3420ff9: First stable release. `cacheAppwrite()` wires Astro route caching to the Appwrite Sites CDN: a route's cache intent becomes an `Appwrite-CDN-Cache-Control` directive with its tags in `Appwrite-CDN-Cache-Key`, `cache.invalidate()` purges by path or tag through the Appwrite proxy API, and a route that declares no cache intent is sent as `no-store` so the CDN's default TTL cannot cache it. Endpoint, project ID, API key and domain are read from the Appwrite Sites runtime, so `cache: { provider: cacheAppwrite() }` needs no configuration to deploy.

### Minor Changes

- 5db9419: Adds `AppwriteCacheError` to the public exports, so a misconfigured purge can be told apart from a failed API call with `instanceof`, and adds the `@appwrite.io/cdn-for-astro/cache` entry point alongside the package root. Marks the package `sideEffects: false` for bundler tree-shaking.

  Raises `engines.node` to `>=22.12.0` to match the `astro` peer dependency. The previous `>=20.3.0` advertised Node 20 and 21 support that could never work, since every Astro 7 release requires Node 22.12 or newer.
