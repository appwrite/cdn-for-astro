# Contributing

Thank you for your interest in contributing! This repository follows the
[Appwrite contributing guide](https://github.com/appwrite/.github/blob/main/CONTRIBUTING.md) and the
[Appwrite code of conduct](https://github.com/appwrite/.github/blob/main/CODE_OF_CONDUCT.md). What
follows is what is specific to this package.

## What this package is

The cache provider that connects [Astro's route caching](https://docs.astro.build/en/guides/caching/)
to the Appwrite CDN. It is **not** an adapter: Appwrite Sites runs Astro through
[`@astrojs/node`](https://docs.astro.build/en/guides/integrations-guide/node/), which stays the
adapter. This package only supplies `cache.provider`.

The provider originally lived in the Astro monorepo as `packages/integrations/appwrite`. Formatting
and lint rules here deliberately mirror [`withastro/astro`](https://github.com/withastro/astro) —
tabs, single quotes, 100 columns — so that code stays easy to move between the two. That is why this
repo uses Biome with tabs while most Appwrite repos use Prettier defaults. Please do not "fix" it to
match the others.

## Getting started

Requires Node.js 22.12 or newer, matching the `engines.node` of the `astro` peer dependency.

```bash
git clone https://github.com/appwrite/cdn-for-astro.git
cd cdn-for-astro
npm install
npm run build
npm test
```

## Commands

| Command                  | What it does                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| `npm run build`          | Compile `src/` to `dist/` with type declarations                   |
| `npm run dev`            | Same, in watch mode                                                |
| `npm test`               | Build, then run the test suite against `dist/`                     |
| `npm run test:coverage`  | The same run with coverage reported                                |
| `npm run typecheck`      | Type check `src/` and the test suite                               |
| `npm run check`          | Format and lint with Biome, applying safe fixes                    |
| `npm run package:check`  | Validate the publishable package with publint and attw             |
| `npm run changeset`      | Record a changeset for your change                                 |

A pre-commit hook formats and lints staged files through Biome. It is installed by `npm install`.

## Testing

Tests are plain `node:test` files that import from `dist/`, not from `src/`, so every run exercises
the artifact that gets published. `pretest` builds for you.

`test/cache-invalidate.test.js` is worth understanding before changing invalidation: it drives the
real `node-appwrite` SDK against a stub HTTP server rather than mocking the SDK, so it asserts the
request that actually goes over the wire — the URL, the `x-appwrite-project` and `x-appwrite-key`
headers, and the payload the invalidation endpoint validates. Mocking the SDK instead would let a
breaking SDK upgrade pass CI.

`examples/basic` is a real Astro site wired to the provider, and CI builds it on every pull request.
It is the only check that proves the provider still loads inside an Astro build. Use it to inspect
real headers:

```bash
cd examples/basic
npm install && npm run build && npm run preview
curl -sI http://localhost:4321/products/1 | grep -i appwrite
```

## Submitting a change

Branch names follow the Appwrite convention, `TYPE-ISSUE_ID-DESCRIPTION`, for example
`feat-42-purge-whole-domain`. `TYPE` is one of `feat`, `fix`, `doc`, `refactor`, or `cicd`.

1. Add or update tests for the behaviour you changed.
2. Run `npm run check`, `npm run typecheck`, and `npm test`.
3. Run `npm run changeset` and commit the generated file, unless the change is invisible to users
   (CI config, internal refactor, README wording). The changeset text becomes the CHANGELOG entry,
   so write it for someone reading release notes.
4. Open a pull request. CI runs lint, type check, tests on Node 20, 22 and 24, the package checks,
   and the example build.

## Releasing

Maintainers only.

1. Merging to `main` opens or updates a **"chore: version packages"** pull request that applies the
   pending changesets: it bumps the version in `package.json` and writes `CHANGELOG.md`.
2. Merge that pull request.
3. Publish a [GitHub Release](https://github.com/appwrite/cdn-for-astro/releases/new) tagged
   `v<version>`, matching the version now in `package.json`.
4. The Release workflow verifies the tag against `package.json`, re-runs the checks, and publishes
   to npm with provenance. A prerelease tag such as `v0.2.0-rc.1` publishes under the `next`
   dist-tag instead of `latest`.

Publishing requires the `NPM_TOKEN` secret and the `npm` environment on this repository.

## Module format

This package is **ESM-only**, deliberately, and matches how `astro` and `@astrojs/node` are
published: `"type": "module"`, plain string `exports`, no `main`, `module`, `types`, `jsdelivr` or
`unpkg` fields. Please do not add a CommonJS or IIFE build to bring it in line with the browser
SDKs — the shapes differ because the packages differ.

- **CommonJS is unreachable.** Astro's config loader only accepts `astro.config.mjs`, `.js`, `.ts`
  and `.mts`; there is no `.cjs`. `astro` is itself ESM-only. No supported consumer can `require()`
  this package.
- **A browser build cannot work.** The provider imports `node:async_hooks`, reads `process.env`, and
  loads `node-appwrite`, which depends on `undici`. There is no browser API surface here: this
  package configures a build and runs inside the site's server function.
- **A dual build would introduce a real bug.** `provider.ts` holds an `AsyncLocalStorage` and
  `utils.ts` a warning set, both module-level. Two copies loaded in one process means `onRequest`
  populates one store and `invalidate()` reads the other, which surfaces as an
  `AppwriteCacheError` about an unresolvable domain rather than as an obvious loading problem.

`attw` therefore runs under `--profile esm-only`. Its `node10` and CommonJS marks are correct for a
package like this, and failing CI on them would be failing on a non-problem.

**jsDelivr needs no configuration.** Every npm package is served automatically, scoped ones
included, so `https://cdn.jsdelivr.net/npm/@appwrite.io/cdn-for-astro` works as soon as a version is
published. The `jsdelivr` and `unpkg` fields in a package like `appwrite` only choose which file the
bare URL resolves to, which matters for a `<script>` tag and not here.

## Branch protection

The rules for `main` live in [`.github/rulesets/main.json`](./.github/rulesets/main.json) so that
they are reviewable in a pull request rather than being invisible repository settings. Apply them
with:

```bash
./scripts/apply-branch-protection.sh
```

or import the same file through **Settings → Rules → Rulesets → New ruleset → Import a ruleset**.

Apply it only after CI has run on `main` at least once: the ruleset requires status checks by name,
and a required check that has never reported blocks every pull request.
