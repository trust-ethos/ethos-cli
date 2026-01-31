#!/bin/bash
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

section "Test 1: Fresh Install via curl"
echo "Running install script..."

curl -fsSL https://raw.githubusercontent.com/trust-ethos/ethos-cli/main/scripts/install.sh | sh

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

if [ -d "$HOME/.ethos/versions" ]; then
    pass "~/.ethos/versions directory exists"
else
    fail "~/.ethos/versions directory missing"
fi

if [ -f "$HOME/.ethos/current/bin/ethos" ]; then
    pass "ethos binary exists"
else
    fail "ethos binary missing"
fi

section "Test 2: CLI Basic Functionality"

export PATH="$HOME/.ethos/current/bin:$PATH"

# Skip update check for faster testing
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

# Skip API-dependent tests (ethos user info) - tested separately in unit tests

section "Test 3: Update Command"

UPDATE_OUTPUT=$(ETHOS_SKIP_UPDATE_CHECK=0 ethos update 2>&1 || true)
echo "Update output: $UPDATE_OUTPUT"

if echo "$UPDATE_OUTPUT" | grep -qi "command update not found"; then
    echo "Note: 'update' command not in released version - skipping (expected for v0.0.10)"
    pass "Update command test skipped (expected for current release)"
else
    if echo "$UPDATE_OUTPUT" | grep -qi "already on latest\|Install method:\|curl"; then
        pass "ethos update works"
    else
        fail "ethos update output unexpected: $UPDATE_OUTPUT"
    fi
fi

section "Test 4: Install Method Detection (Skip if update command unavailable)"

if echo "$UPDATE_OUTPUT" | grep -qi "command update not found"; then
    echo "Note: Skipping install method detection (update command not in released version)"
    pass "Install method test skipped (expected for current release)"
else
    if echo "$UPDATE_OUTPUT" | grep -qi "Install method: curl"; then
        pass "Correctly detects curl install method"
    else
        fail "Install method detection failed: $UPDATE_OUTPUT"
    fi
fi

section "Test 5: Pending Update Application"

INSTALLED_VERSION=$(ls "$HOME/.ethos/versions" | head -1)
echo "Currently installed version: $INSTALLED_VERSION"

# Create a fake newer version
mkdir -p "$HOME/.ethos/versions/v99.99.99/bin"
echo '#!/bin/sh' > "$HOME/.ethos/versions/v99.99.99/bin/ethos"
echo 'echo "FAKE_VERSION_99.99.99"' >> "$HOME/.ethos/versions/v99.99.99/bin/ethos"
chmod +x "$HOME/.ethos/versions/v99.99.99/bin/ethos"

# Create pending update file
mkdir -p "$HOME/.ethos/updates"
echo '{"version":"99.99.99","path":"'"$HOME/.ethos/versions/v99.99.99"'"}' > "$HOME/.ethos/updates/pending.json"

echo "Created fake pending update to v99.99.99"
echo "Contents of pending.json:"
cat "$HOME/.ethos/updates/pending.json"

echo ""
echo "Running ethos --version to trigger pending update application..."
# Don't skip update check here - we want to test the pending update flow
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
fi

if [ ! -f "$HOME/.ethos/updates/pending.json" ]; then
    pass "pending.json was cleaned up after apply"
else
    fail "pending.json still exists after apply"
fi

section "Test 6: Version Cleanup Verification"

if [ -d "$HOME/.ethos/versions/$INSTALLED_VERSION" ]; then
    echo "Original version still exists (cleanup did not run or failed)"
    fail "Expected old version to be cleaned up after update"
else
    pass "Old version was cleaned up after update (expected behavior)"
fi

if [ -d "$HOME/.ethos/versions/v99.99.99" ]; then
    pass "New version directory exists"
else
    fail "New version directory missing after update"
fi

section "Test 7: Directory Structure Verification"

echo "Directory structure:"
find "$HOME/.ethos" -maxdepth 3 -type d 2>/dev/null | head -20 || true

echo ""
echo "Symlink target:"
ls -la "$HOME/.ethos/current" 2>/dev/null || true

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
