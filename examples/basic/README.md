# Basic example

A minimal Astro site that caches through the Appwrite CDN, covering the three ways
caching is configured:

| Route              | Cached by             | Tags                      |
| ------------------ | --------------------- | ------------------------- |
| `/`                | `Astro.cache.set()`   | `home`                    |
| `/products/[id]`   | `routeRules`          | `products`, `product:<id>` |
| `/api/revalidate`  | never (`cache.set(false)`) | —                    |

## Run it

```bash
npm install
npm run build
npm run preview
```

`npm run preview` serves the standalone Node build on <http://localhost:4321>, which is
what Appwrite Sites runs. Caching is a no-op in `astro dev` — the cache object exists but
nothing is cached — so use the build to inspect real headers:

```bash
curl -sI http://localhost:4321/products/1 | grep -i appwrite
# appwrite-cdn-cache-control: public, max-age=3600, stale-while-revalidate=60
# appwrite-cdn-cache-key: products product:1
```

The Appwrite edge reads those two headers and rewrites them for the CDN in front of the
domain. Locally they are just headers on a response — nothing caches them.

## Purge

```bash
curl -X POST http://localhost:4321/api/revalidate \
  -H 'content-type: application/json' \
  -d '{"tags":["products"]}'
```

Run locally this fails, and should: there is no Appwrite project behind it, so the
provider has no endpoint, project ID, or API key to resolve and reports what is missing.
Deployed to Appwrite Sites, the runtime supplies all three and the purge goes through —
provided the site's dynamic API key carries the `proxy.invalidations.write` scope.

## Deploy

Push this directory to a Git repository and connect it as an Appwrite Site. Appwrite
detects Astro, runs `npm run build`, and serves `dist/server/entry.mjs`. Replace the
`file:../..` dependency with the published package first:

```bash
npm install @appwrite.io/cdn-for-astro
```
