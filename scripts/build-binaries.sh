#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")

echo "Building ethos CLI v$VERSION binaries..."

TARGETS="darwin-arm64,darwin-x64,linux-x64,linux-arm64,win32-x64"

npx oclif pack tarballs \
  --root=. \
  --targets="$TARGETS" \
  --parallel \
  --xz

echo ""
echo "Binaries built in dist/:"
ls -lh dist/*.tar.*
