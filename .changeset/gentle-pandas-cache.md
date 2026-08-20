---
'@appwrite.io/cdn-for-astro': minor
---

Adds `AppwriteCacheError` to the public exports, so a misconfigured purge can be told apart from a failed API call with `instanceof`, and adds the `@appwrite.io/cdn-for-astro/cache` entry point alongside the package root. Marks the package `sideEffects: false` for bundler tree-shaking.
