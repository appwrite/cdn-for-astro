---
'@appwrite.io/cdn-for-astro': minor
---

Adds `AppwriteCacheError` to the public exports, so a misconfigured purge can be told apart from a failed API call with `instanceof`, and adds the `@appwrite.io/cdn-for-astro/cache` entry point alongside the package root. Marks the package `sideEffects: false` for bundler tree-shaking.

Raises `engines.node` to `>=22.12.0` to match the `astro` peer dependency. The previous `>=20.3.0` advertised Node 20 and 21 support that could never work, since every Astro 7 release requires Node 22.12 or newer.
