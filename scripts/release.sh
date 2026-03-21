#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
	echo "Usage: ./scripts/release.sh <version>"
	echo "Example: ./scripts/release.sh 0.5.0"
	exit 1
fi

VERSION="$1"

if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
	echo "Error: version must be in semver format (e.g. 0.5.0)"
	exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
	echo "Error: working tree is not clean — commit or stash changes first"
	exit 1
fi

if git tag | grep -q "^v${VERSION}$"; then
	echo "Error: tag v${VERSION} already exists"
	exit 1
fi

sed -i '' "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" package.json
sed -i '' "s/SITE_VERSION = \".*\"/SITE_VERSION = \"${VERSION}\"/" src/lib/menu-items.ts

echo ""
echo "Version updated to ${VERSION} in:"
echo "  - package.json"
echo "  - src/lib/menu-items.ts"
echo ""
echo "Remember to update src/components/changelog-screen.tsx manually."
echo ""
echo "Next steps:"
echo "  git add -A && git commit -m \"chore: bump version to v${VERSION}\""
echo "  git tag v${VERSION}"
echo "  git push && git push --tags"
