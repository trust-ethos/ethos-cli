#!/bin/bash
# Tests the update system using a locally-built tarball (not released version)
# This catches update system bugs BEFORE release
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

section() {
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
}

TARBALL_PATH="${1:-/tmp/ethos-local.tar.gz}"

if [ ! -f "$TARBALL_PATH" ]; then
    echo -e "${RED}Error: Tarball not found at $TARBALL_PATH${NC}"
    echo "Usage: $0 <path-to-tarball>"
    exit 1
fi

section "Test 1: Install from Local Tarball"

rm -rf "$HOME/.ethos"
mkdir -p "$HOME/.ethos/versions/v-local"

echo "Extracting tarball..."
tar -xzf "$TARBALL_PATH" -C "$HOME/.ethos/versions/v-local" --strip-components=1

ln -sf "$HOME/.ethos/versions/v-local" "$HOME/.ethos/current"

if [ -d "$HOME/.ethos" ]; then
    pass "~/.ethos directory created"
else
    fail "~/.ethos directory not created"
fi

if [ -L "$HOME/.ethos/current" ]; then
    pass "~/.ethos/current symlink exists"
else
    fail "~/.ethos/current symlink missing"
fi

if [ -f "$HOME/.ethos/current/bin/ethos" ]; then
    pass "ethos binary exists"
else
    fail "ethos binary missing"
fi

section "Test 2: CLI Basic Functionality"

export PATH="$HOME/.ethos/current/bin:$PATH"
export ETHOS_SKIP_UPDATE_CHECK=1

VERSION_OUTPUT=$(ethos --version 2>&1 || true)
if echo "$VERSION_OUTPUT" | grep -q "@trust-ethos/cli"; then
    pass "ethos --version works: $VERSION_OUTPUT"
else
    fail "ethos --version failed: $VERSION_OUTPUT"
fi

HELP_OUTPUT=$(ethos --help 2>&1 || true)
if echo "$HELP_OUTPUT" | grep -q "COMMANDS"; then
    pass "ethos --help works"
else
    fail "ethos --help failed"
fi

section "Test 3: Install Method Detection"

INSTALL_INFO=$(ETHOS_SKIP_UPDATE_CHECK=0 ethos update 2>&1 || true)
echo "Update command output: $INSTALL_INFO"

if echo "$INSTALL_INFO" | grep -qi "Install method: curl"; then
    pass "Correctly detects curl install method"
elif echo "$INSTALL_INFO" | grep -qi "command update not found"; then
    fail "Update command not found - was it built correctly?"
else
    fail "Install method detection failed: $INSTALL_INFO"
fi

section "Test 4: Pending Update Application"

INSTALLED_VERSION="v-local"
echo "Currently installed version: $INSTALLED_VERSION"

mkdir -p "$HOME/.ethos/versions/v99.99.99/bin"
cat > "$HOME/.ethos/versions/v99.99.99/bin/ethos" << 'FAKESCRIPT'
#!/bin/sh
echo "FAKE_VERSION_99.99.99"
FAKESCRIPT
chmod +x "$HOME/.ethos/versions/v99.99.99/bin/ethos"

mkdir -p "$HOME/.ethos/updates"
echo '{"version":"99.99.99","path":"'"$HOME/.ethos/versions/v99.99.99"'"}' > "$HOME/.ethos/updates/pending.json"

echo "Created fake pending update to v99.99.99"
cat "$HOME/.ethos/updates/pending.json"

echo ""
echo "Running ethos --version to trigger pending update application..."
PENDING_OUTPUT=$(ETHOS_SKIP_UPDATE_CHECK=0 ethos --version 2>&1 || true)
echo "Output: $PENDING_OUTPUT"

CURRENT_TARGET=$(readlink "$HOME/.ethos/current" || echo "broken")
if echo "$CURRENT_TARGET" | grep -q "v99.99.99"; then
    pass "Pending update was applied - symlink points to v99.99.99"
else
    fail "Pending update NOT applied - symlink points to: $CURRENT_TARGET"
fi

if echo "$PENDING_OUTPUT" | grep -qi "updated to v99.99.99\|FAKE_VERSION"; then
    pass "Update message shown or fake version running"
else
    echo "Note: Output was: $PENDING_OUTPUT"
    fail "Expected update message or fake version output"
fi

if [ ! -f "$HOME/.ethos/updates/pending.json" ]; then
    pass "pending.json was cleaned up after apply"
else
    fail "pending.json still exists after apply"
fi

section "Test 5: Version Cleanup Verification"

if [ -d "$HOME/.ethos/versions/$INSTALLED_VERSION" ]; then
    fail "Old version should be cleaned up after update"
else
    pass "Old version was cleaned up after update"
fi

if [ -d "$HOME/.ethos/versions/v99.99.99" ]; then
    pass "New version directory exists"
else
    fail "New version directory missing"
fi

section "Test Summary"

echo ""
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
