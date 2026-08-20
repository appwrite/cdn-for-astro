#!/usr/bin/env bash
#
# Applies .github/rulesets/main.json to this repository.
#
# Apply it only once the CI workflow has run on the default branch at least
# once. The ruleset requires status checks by name, and a required check that
# has never reported blocks every pull request, including the one that would
# add the workflow.
#
# Requires the GitHub CLI, authenticated with admin on the repository.
#
#   ./scripts/apply-branch-protection.sh [owner/repo]
#
# The same file can be imported through the GitHub UI instead:
# Settings -> Rules -> Rulesets -> New ruleset -> Import a ruleset.

set -euo pipefail

repo="${1:-appwrite/cdn-for-astro}"
ruleset="$(dirname "$0")/../.github/rulesets/main.json"

if [ ! -f "$ruleset" ]; then
	echo "Cannot find $ruleset" >&2
	exit 1
fi

name="$(node -p "require('$ruleset').name")"
existing="$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id" || true)"

if [ -n "$existing" ]; then
	echo "Updating ruleset '$name' ($existing) on $repo"
	gh api --method PUT "repos/$repo/rulesets/$existing" --input "$ruleset"
else
	echo "Creating ruleset '$name' on $repo"
	gh api --method POST "repos/$repo/rulesets" --input "$ruleset"
fi

echo "Done."
