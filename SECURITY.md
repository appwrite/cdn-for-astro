# Security Policy

## Reporting a Vulnerability

Please **do not** report security vulnerabilities through public GitHub issues, discussions, or pull requests.

Report them privately using either:

1. [GitHub private vulnerability reporting](https://github.com/appwrite/cdn-for-astro/security/advisories/new)
2. Email [security@appwrite.io](mailto:security@appwrite.io)

Include as much of the following as you can:

- A description of the issue and why it is security-sensitive
- Affected versions, tags, or commit SHAs
- Steps to reproduce, or a proof of concept
- Impact (confidentiality, integrity, availability, or privilege)
- Any suggested mitigations or fixes

We will acknowledge the report and follow up with next steps. If the issue is confirmed, we will work on a fix and coordinate public disclosure with you. Please give us a reasonable time to investigate and ship a fix before discussing the issue publicly.

## Supported Versions

Security updates are published for the latest minor release of this package. Upgrade to the latest patch of the current minor release whenever possible.

## Scope

This policy covers this package: the cache provider it publishes and the invalidation requests it sends to the Appwrite API.

Out of scope here, and reportable elsewhere:

- The Appwrite server, Console, and Cloud — see the [Appwrite security policy](https://github.com/appwrite/appwrite/blob/main/SECURITY.md)
- The Appwrite CDN and edge, which enforce caching and purging — [security@appwrite.io](mailto:security@appwrite.io)
- Astro itself, including its route caching core — see [withastro/astro](https://github.com/withastro/astro/security/policy)

When in doubt, report it to [security@appwrite.io](mailto:security@appwrite.io) and we will route it.

## A note on API keys

This package resolves an Appwrite API key in order to purge. Prefer the default: the dynamic key
that the Appwrite Sites runtime attaches to each request as the `x-appwrite-key` header. A key
passed as the `apiKey` option is baked into the build output instead, which is a wider exposure
than it looks. The key only ever needs the `proxy.invalidations.write` scope.
