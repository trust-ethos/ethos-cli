#!/bin/bash
set -e

VERSION=${1:-$(node -p "require('./package.json').version")}
FORMULA_FILE="homebrew/ethos.rb"

echo "Updating Homebrew formula for v$VERSION..."

declare -A SHAS

for platform in darwin-arm64 darwin-x64 linux-arm64 linux-x64; do
  URL="https://github.com/trust-ethos/ethos-cli/releases/download/v$VERSION/ethos-v$VERSION-$platform.tar.gz"
  echo "  Calculating SHA256 for $platform..."
  SHA=$(curl -fsSL "$URL" | shasum -a 256 | cut -d' ' -f1)
  SHAS[$platform]=$SHA
  echo "    $SHA"
done

sed -i.bak "s/version \".*\"/version \"$VERSION\"/" "$FORMULA_FILE"
sed -i.bak "s/PLACEHOLDER_SHA256_DARWIN_ARM64/${SHAS[darwin-arm64]}/" "$FORMULA_FILE"
sed -i.bak "s/PLACEHOLDER_SHA256_DARWIN_X64/${SHAS[darwin-x64]}/" "$FORMULA_FILE"
sed -i.bak "s/PLACEHOLDER_SHA256_LINUX_ARM64/${SHAS[linux-arm64]}/" "$FORMULA_FILE"
sed -i.bak "s/PLACEHOLDER_SHA256_LINUX_X64/${SHAS[linux-x64]}/" "$FORMULA_FILE"
rm -f "$FORMULA_FILE.bak"

echo ""
echo "Formula updated! Copy homebrew/ethos.rb to your Homebrew tap repository."
