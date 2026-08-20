# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets). Every pull
request that changes published behaviour should add a changeset describing the change:

```bash
npm run changeset
```

Pick the bump type (`patch`, `minor` or `major`) and write the entry in the voice of the
CHANGELOG — it is what users read when they upgrade.

On merge to `main`, the Version workflow collects the pending changesets into a
"Version Packages" pull request that bumps `package.json` and writes `CHANGELOG.md`.
Merging that pull request, then publishing a GitHub Release for the new tag, ships the
version to npm.
