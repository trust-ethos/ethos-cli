# Ethos CLI Production-Ready Plan

## TL;DR

> **Quick Summary**: Fix critical bugs, achieve 80% test coverage, add shell completions and config file support, then enhance activity filtering and XP season queries.
> 
> **Deliverables**:
> - 6 critical bug fixes across commands and API client
> - Comprehensive test suite (command tests, API tests, formatter tests)
> - Shell completions for bash, zsh, fish via @oclif/plugin-autocomplete
> - Config file support at ~/.config/ethos/config.json
> - Activity type filtering (--type vouch|review)
> - XP by season flag (--season)
> - Updated SKILL.md documentation
> 
> **Estimated Effort**: Medium (3-4 days)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 7 → Task 11 → Task 13

---

## Context

### Original Request
Make the Ethos CLI production-ready and feature-rich with:
- Critical bug fixes
- 80% test coverage (from ~15% currently)
- Shell completions, config file support
- New features (activity filtering, XP seasons)

### Interview Summary
**Key Discussions**:
- Error handling uses `this.log(formatError()) + this.exit(1)` pattern across all commands
- Dead code exists (unreachable throw after catch blocks)
- No input validation for limit flags, no fetch timeouts
- SKILL.md references non-existent `xp balance` command
- User confirmed: remove xp balance reference, don't add command
- User confirmed: single --type filter value, not multiple
- User confirmed: skip leaderboard command (no API endpoint exists)

**Research Findings**:
- 5 commands follow consistent oclif pattern
- EchoClient has 11 methods, all use `/api/v2/` endpoints
- `/xp/user/{userkey}/season/{seasonId}` endpoint available for XP by season
- @oclif/plugin-autocomplete is official shell completion solution
- XDG standard recommends ~/.config/ethos/config.json

---

## Work Objectives

### Core Objective
Transform the Ethos CLI from a working prototype to a production-ready tool with comprehensive tests, proper error handling, shell completions, and user configuration support.

### Concrete Deliverables
- `src/commands/user/info.ts` - Fixed error handling, validated inputs
- `src/commands/user/search.ts` - Fixed error handling, validated limit
- `src/commands/user/activity.ts` - Fixed error handling, validated limit, added --type flag
- `src/commands/xp/rank.ts` - Fixed error handling, added --season flag
- `src/commands/xp/seasons.ts` - Fixed error handling
- `src/lib/api/echo-client.ts` - Added fetch timeout, added getXpBySeason method
- `src/lib/formatting/output.ts` - Removed unused _flags parameter
- `src/lib/config/index.ts` - New config file handler
- `test/commands/**/*.test.ts` - Command integration tests
- `test/lib/api/echo-client.test.ts` - Expanded API tests with mocking
- `test/lib/formatting/output.test.ts` - Formatter tests
- `SKILL.md` - Removed xp balance reference, updated docs

### Definition of Done
- [ ] All 6 critical issues fixed
- [ ] `bun test` passes with 80%+ coverage
- [ ] `ethos --help` shows completion instructions
- [ ] `~/.config/ethos/config.json` is read on startup
- [ ] `ethos user activity --type vouch 0xNowater` works
- [ ] `ethos xp rank --season 2 0xNowater` works

### Must Have
- All commands use consistent error handling
- Input validation with clear error messages
- Fetch timeout (10 seconds)
- Shell completions working for bash, zsh, fish
- Config file support with env override
- 80%+ test coverage

### Must NOT Have (Guardrails)
- No write operations (reviews, vouches, etc.)
- No GraphQL support
- No caching layer
- No binary builds (separate future phase)
- No xp balance command (user decided against)
- No leaderboard top N command (no API endpoint)
- No over-engineering config (simple JSON only)
- No breaking changes to existing command signatures

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test configured)
- **User wants tests**: YES (TDD for new code, tests-after for fixes)
- **Framework**: bun test with @oclif/test utilities

### TDD Structure for New Features

Each new feature (--type flag, --season flag, config) follows:

1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping green

### Automated Verification (All Tasks)

**For Command Changes** (using Bash):
```bash
# Verify command works
./bin/dev.js user info 0xNowater --json | jq .score
# Assert: Returns numeric score

# Verify validation
./bin/dev.js user search test --limit -1 2>&1
# Assert: Contains "limit must be between 1 and 100"

# Verify timeout
ETHOS_API_URL=http://10.255.255.1 timeout 15 ./bin/dev.js user info test 2>&1
# Assert: Contains "timeout" or "timed out" within 12 seconds
```

**For Test Coverage** (using Bash):
```bash
bun test --coverage
# Assert: Overall coverage >= 80%
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Foundation):
├── Task 1: Fix error handling pattern (all 5 commands)
├── Task 2: Add fetch timeout to EchoClient
├── Task 3: Remove unused _flags parameter
└── Task 4: Update SKILL.md (remove xp balance)

Wave 2 (After Wave 1 - Validation & Testing Setup):
├── Task 5: Add input validation (limit bounds)
├── Task 6: Remove dead code (unreachable throws)
└── Task 7: Add command test infrastructure

Wave 3 (After Wave 2 - Test Coverage):
├── Task 8: Add EchoClient API tests with mocking
├── Task 9: Add output formatter tests
└── Task 10: Add command integration tests

Wave 4 (After Wave 3 - New Features):
├── Task 11: Add shell completions plugin
├── Task 12: Add config file support
├── Task 13: Add --type flag to activity command
└── Task 14: Add --season flag to xp rank command
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 7, 10 | 2, 3, 4 |
| 2 | None | 8 | 1, 3, 4 |
| 3 | None | 9 | 1, 2, 4 |
| 4 | None | None | 1, 2, 3 |
| 5 | 1 | 10 | 6, 7 |
| 6 | 1 | 10 | 5, 7 |
| 7 | 1 | 8, 9, 10 | 5, 6 |
| 8 | 2, 7 | 14 | 9, 10 |
| 9 | 3, 7 | None | 8, 10 |
| 10 | 5, 6, 7 | 13, 14 | 8, 9 |
| 11 | None | None | 12, 13, 14 |
| 12 | None | None | 11, 13, 14 |
| 13 | 10 | None | 11, 12, 14 |
| 14 | 8, 10 | None | 11, 12, 13 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Approach |
|------|-------|---------------------|
| 1 | 1, 2, 3, 4 | Parallel: 4 independent tasks |
| 2 | 5, 6, 7 | Parallel after Wave 1 |
| 3 | 8, 9, 10 | Parallel after Wave 2 |
| 4 | 11, 12, 13, 14 | Parallel after Wave 3 (11, 12 can start earlier) |

---

## TODOs

### Wave 1: Foundation Fixes

- [ ] 1. Fix error handling pattern across all commands

  **What to do**:
  - Replace `this.log(formatError(error)) + this.exit(1)` with `this.error(error.message, { exit: 1 })`
  - Or keep current pattern but make it consistent (both are valid)
  - Decision: Keep current pattern (formatError has nice suggestions) but ensure all 5 commands use it identically
  - Verify each command's catch block follows exact same structure

  **Must NOT do**:
  - Don't change the formatError function itself
  - Don't change exit codes (1 for errors)
  - Don't add new error types

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
    - `git-master`: Atomic commit for each file change

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 7, 10
  - **Blocked By**: None

  **References**:

  **Pattern References** (current error handling):
  - `src/commands/user/info.ts:48-54` - Current catch block pattern to standardize
  - `src/commands/user/activity.ts:59-65` - Same pattern with this.error on line 49
  - `src/lib/formatting/error.ts:4-66` - formatError function with verbose support

  **Files to modify**:
  - `src/commands/user/info.ts`
  - `src/commands/user/search.ts`
  - `src/commands/user/activity.ts`
  - `src/commands/xp/rank.ts`
  - `src/commands/xp/seasons.ts`

  **Acceptance Criteria**:

  ```bash
  # Verify error output format is consistent
  ./bin/dev.js user info nonexistent_user_12345 2>&1 | grep -q "not found"
  # Assert: Exit code 1, output contains "not found"

  ./bin/dev.js user info nonexistent_user_12345 --verbose 2>&1 | grep -q "Debug Information"
  # Assert: Verbose mode shows debug info
  ```

  **Evidence to Capture:**
  - [ ] Terminal output showing consistent error format across all 5 commands
  - [ ] Diff showing identical catch block structure

  **Commit**: YES
  - Message: `fix(commands): standardize error handling across all commands`
  - Files: `src/commands/user/*.ts`, `src/commands/xp/*.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 2. Add fetch timeout to EchoClient

  **What to do**:
  - Add AbortController with 10-second timeout to the fetch request
  - Handle AbortError and convert to NetworkError with timeout message
  - Add optional timeout parameter to constructor/request method

  **Must NOT do**:
  - Don't add external timeout libraries
  - Don't change API response types
  - Don't add retry logic (separate concern)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 8
  - **Blocked By**: None

  **References**:

  **Pattern References** (fetch implementation):
  - `src/lib/api/echo-client.ts:102-157` - Current request method without timeout
  - `src/lib/api/echo-client.ts:138-156` - Error handling section to extend

  **API References**:
  - `src/lib/errors/cli-error.ts:12-29` - NetworkError class to use

  **External References**:
  - MDN AbortController: https://developer.mozilla.org/en-US/docs/Web/API/AbortController

  **Implementation Pattern**:
  ```typescript
  private async request<T>(path: string, resourceType?: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      // ... existing handling
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError('Request timed out after 10 seconds', url);
      }
      // ... existing error handling
    } finally {
      clearTimeout(timeoutId);
    }
  }
  ```

  **Acceptance Criteria**:

  ```bash
  # Test timeout with unreachable IP (will timeout)
  ETHOS_API_URL=http://10.255.255.1 timeout 15 ./bin/dev.js user info test 2>&1
  # Assert: Output contains "timed out" within ~12 seconds (10s timeout + buffer)
  # Assert: Exit code 1
  ```

  **Evidence to Capture:**
  - [ ] Terminal output showing timeout error message
  - [ ] Timing measurement showing ~10 second timeout

  **Commit**: YES
  - Message: `fix(api): add 10-second fetch timeout to prevent hanging requests`
  - Files: `src/lib/api/echo-client.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 3. Remove unused _flags parameter from output function

  **What to do**:
  - Remove the `_flags` parameter from the `output<T>` function signature
  - Update all call sites (5 commands) to not pass flags
  - The function only does JSON.stringify, flags are not used

  **Must NOT do**:
  - Don't change other formatter functions
  - Don't change the JSON output format

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/lib/formatting/output.ts:4-6` - Function to modify
  - `src/commands/user/info.ts:44` - Call site: `output(user, flags)`
  - `src/commands/user/search.ts:48-49` - Call site: `output(response, flags)`
  - `src/commands/user/activity.ts:54-55` - Call site
  - `src/commands/xp/rank.ts:50-51` - Call site
  - `src/commands/xp/seasons.ts:34-35` - Call site

  **Acceptance Criteria**:

  ```bash
  # Verify JSON output still works
  ./bin/dev.js user info 0xNowater --json | jq .score
  # Assert: Returns numeric score (JSON parsing succeeds)

  # Verify TypeScript compiles
  bun run typecheck
  # Assert: Exit code 0
  ```

  **Evidence to Capture:**
  - [ ] TypeScript compilation passes
  - [ ] JSON output unchanged

  **Commit**: YES
  - Message: `refactor(output): remove unused flags parameter from output function`
  - Files: `src/lib/formatting/output.ts`, `src/commands/**/*.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 4. Update SKILL.md to remove xp balance reference

  **What to do**:
  - Remove the `ethos xp balance <userkey>` section (lines 105-134)
  - Update any cross-references to xp balance
  - Verify remaining documentation is accurate

  **Must NOT do**:
  - Don't add new commands to docs
  - Don't change other command documentation

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Documentation References**:
  - `SKILL.md:105-134` - XP balance section to remove
  - `SKILL.md:289-298` - Workflow 2 references xp balance (update to use user info)

  **Acceptance Criteria**:

  ```bash
  # Verify xp balance is not in SKILL.md
  grep -c "xp balance" SKILL.md
  # Assert: Returns 0

  # Verify document is valid markdown
  cat SKILL.md | head -20
  # Assert: Markdown structure intact
  ```

  **Evidence to Capture:**
  - [ ] grep output showing 0 matches for "xp balance"

  **Commit**: YES
  - Message: `docs(skill): remove non-existent xp balance command reference`
  - Files: `SKILL.md`
  - Pre-commit: None

---

### Wave 2: Validation & Testing Setup

- [ ] 5. Add input validation for limit flag

  **What to do**:
  - Add validation to ensure limit is between 1 and 100
  - Apply to: user search (--limit), user activity (--limit)
  - Show clear error message: "limit must be between 1 and 100"
  - Use oclif's built-in validation or early check in run()

  **Must NOT do**:
  - Don't add complex validation library
  - Don't change default values (10)
  - Don't add validation to commands without limit flag

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7)
  - **Blocks**: Task 10
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/commands/user/search.ts:29-33` - Limit flag definition
  - `src/commands/user/activity.ts:28-32` - Limit flag definition
  - `src/lib/errors/cli-error.ts:49-58` - ValidationError class

  **Implementation Pattern**:
  ```typescript
  // Option 1: In flag definition
  limit: Flags.integer({
    char: 'l',
    description: 'Maximum number of results (1-100)',
    default: 10,
    min: 1,
    max: 100,
  }),

  // Option 2: In run() method
  if (flags.limit < 1 || flags.limit > 100) {
    this.error('limit must be between 1 and 100', { exit: 2 });
  }
  ```

  **Acceptance Criteria**:

  ```bash
  # Test invalid limit values
  ./bin/dev.js user search test --limit 0 2>&1
  # Assert: Contains "limit must be between 1 and 100", exit code 2

  ./bin/dev.js user search test --limit -5 2>&1
  # Assert: Contains "limit must be between 1 and 100", exit code 2

  ./bin/dev.js user search test --limit 101 2>&1
  # Assert: Contains "limit must be between 1 and 100", exit code 2

  # Test valid limit
  ./bin/dev.js user search test --limit 5 --json | jq .limit
  # Assert: Returns 5 or valid response
  ```

  **Evidence to Capture:**
  - [ ] Terminal output showing validation errors for invalid limits
  - [ ] Successful execution with valid limit

  **Commit**: YES
  - Message: `feat(validation): add limit bounds (1-100) to search and activity commands`
  - Files: `src/commands/user/search.ts`, `src/commands/user/activity.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 6. Remove dead code (unreachable throw statements)

  **What to do**:
  - Remove `throw error` statements after catch blocks that exit
  - These are unreachable because `this.exit(1)` terminates execution
  - Pattern appears in all 5 commands

  **Must NOT do**:
  - Don't remove the catch blocks themselves
  - Don't change error handling logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7)
  - **Blocks**: Task 10
  - **Blocked By**: Task 1

  **References**:

  **Pattern References** (dead code locations):
  - `src/commands/user/info.ts:53` - `throw error` after exit
  - `src/commands/user/search.ts:57` - `throw error` after exit
  - `src/commands/user/activity.ts:64` - `throw error` after exit
  - `src/commands/xp/rank.ts:60` - `throw error` after exit
  - `src/commands/xp/seasons.ts:44` - `throw error` after exit

  **Current Pattern (to fix)**:
  ```typescript
  } catch (error) {
    if (error instanceof Error) {
      this.log(formatError(error, flags.verbose));
      this.exit(1);
    }
    throw error;  // <-- DEAD CODE: this.exit() never returns
  }
  ```

  **Fixed Pattern**:
  ```typescript
  } catch (error) {
    if (error instanceof Error) {
      this.log(formatError(error, flags.verbose));
      this.exit(1);
    }
    // Unreachable: oclif guarantees error is Error instance
    // If somehow reached, re-throw for debugging
    throw error;
  }
  ```

  Actually, keep the throw but add a comment explaining it's a safety net.
  Or remove it entirely since oclif errors are always Error instances.

  **Decision**: Remove the throw entirely - it's truly unreachable.

  **Acceptance Criteria**:

  ```bash
  # Verify TypeScript compiles
  bun run typecheck
  # Assert: Exit code 0

  # Verify commands still handle errors
  ./bin/dev.js user info nonexistent_user_xyz 2>&1 | grep -q "not found"
  # Assert: Error handling still works
  ```

  **Evidence to Capture:**
  - [ ] TypeScript compilation passes
  - [ ] Error handling still functional

  **Commit**: YES
  - Message: `refactor(commands): remove unreachable throw statements after exit`
  - Files: `src/commands/user/*.ts`, `src/commands/xp/*.ts`
  - Pre-commit: `bun run typecheck`

---

- [ ] 7. Add command test infrastructure

  **What to do**:
  - Create test file structure for commands
  - Set up test utilities for mocking API responses
  - Create helper for running commands in tests
  - Add one example command test as template

  **Must NOT do**:
  - Don't write all command tests (separate task)
  - Don't add complex test frameworks beyond bun test

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Tasks 8, 9, 10
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `test/lib/validation/userkey.test.ts` - Existing test pattern
  - `test/lib/api/echo-client.test.ts` - Existing API test structure

  **External References**:
  - oclif testing: https://oclif.io/docs/testing
  - Bun test mocking: https://bun.sh/docs/test/mocking

  **Files to Create**:
  - `test/commands/user/info.test.ts` - Template command test
  - `test/helpers/mock-api.ts` - API mocking utilities

  **Implementation Pattern**:
  ```typescript
  // test/helpers/mock-api.ts
  import { mock } from 'bun:test';

  export function mockEchoClient(overrides: Partial<EchoClient>) {
    return mock.module('../../../src/lib/api/echo-client.js', () => ({
      EchoClient: class {
        ...overrides
      }
    }));
  }

  // test/commands/user/info.test.ts
  import { describe, test, expect, mock, beforeEach } from 'bun:test';
  import { runCommand } from '@oclif/test';

  describe('user info', () => {
    test('displays user profile', async () => {
      // Mock API response
      // Run command
      // Assert output
    });
  });
  ```

  **Acceptance Criteria**:

  ```bash
  # Verify test infrastructure exists
  ls test/commands/user/info.test.ts test/helpers/mock-api.ts
  # Assert: Both files exist

  # Verify tests run
  bun test test/commands/user/info.test.ts
  # Assert: At least 1 test passes
  ```

  **Evidence to Capture:**
  - [ ] Test file structure created
  - [ ] Example test passing

  **Commit**: YES
  - Message: `test(infra): add command testing infrastructure with API mocking`
  - Files: `test/commands/user/info.test.ts`, `test/helpers/mock-api.ts`
  - Pre-commit: `bun test`

---

### Wave 3: Test Coverage

- [ ] 8. Add EchoClient API tests with mocking

  **What to do**:
  - Expand `test/lib/api/echo-client.test.ts` with comprehensive tests
  - Mock fetch to test all API methods without network calls
  - Test error handling (404, network errors, timeouts)
  - Test identifier resolution logic

  **Must NOT do**:
  - Don't make real API calls in tests
  - Don't test oclif internals

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: Task 14
  - **Blocked By**: Tasks 2, 7

  **References**:

  **Pattern References**:
  - `src/lib/api/echo-client.ts:86-261` - All methods to test
  - `test/lib/api/echo-client.test.ts` - Existing test file to expand

  **Test Cases to Cover**:
  1. `getUserByTwitter` - success, 404, network error
  2. `getUserByAddress` - success, 404
  3. `searchUsers` - success, empty results
  4. `resolveUser` - routes to correct method based on identifier
  5. `getLeaderboardRank` - success, 404
  6. `getActivities` - success, empty, with types filter
  7. Request timeout handling
  8. Error response parsing

  **Acceptance Criteria**:

  ```bash
  # Run API tests
  bun test test/lib/api/echo-client.test.ts
  # Assert: All tests pass, >= 15 tests

  # Check coverage of echo-client.ts
  bun test --coverage | grep echo-client
  # Assert: >= 80% coverage
  ```

  **Evidence to Capture:**
  - [ ] Test output showing all API tests pass
  - [ ] Coverage report for echo-client.ts

  **Commit**: YES
  - Message: `test(api): add comprehensive EchoClient tests with fetch mocking`
  - Files: `test/lib/api/echo-client.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 9. Add output formatter tests

  **What to do**:
  - Create `test/lib/formatting/output.test.ts`
  - Test all 7 formatter functions with various inputs
  - Test edge cases (empty arrays, missing fields, long strings)

  **Must NOT do**:
  - Don't test terminal color codes (hard to test, low value)
  - Don't test exact string matching (brittle)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 7

  **References**:

  **Pattern References**:
  - `src/lib/formatting/output.ts:4-205` - All formatters to test

  **Formatter Functions to Test**:
  1. `output<T>` - JSON serialization
  2. `formatUser` - user profile formatting
  3. `formatXP` - XP balance formatting
  4. `formatSeasons` - seasons list formatting
  5. `formatRank` - leaderboard rank formatting
  6. `formatSearchResults` - search results formatting
  7. `formatActivities` - activity feed formatting

  **Test Cases**:
  - Each formatter with valid data
  - Each formatter with minimal data (only required fields)
  - Empty arrays return "No X found" message
  - Long strings are truncated appropriately

  **Acceptance Criteria**:

  ```bash
  # Run formatter tests
  bun test test/lib/formatting/output.test.ts
  # Assert: All tests pass, >= 20 tests

  # Check coverage
  bun test --coverage | grep output.ts
  # Assert: >= 80% coverage
  ```

  **Evidence to Capture:**
  - [ ] Test output showing all formatter tests pass
  - [ ] Coverage report for output.ts

  **Commit**: YES
  - Message: `test(formatting): add comprehensive output formatter tests`
  - Files: `test/lib/formatting/output.test.ts`
  - Pre-commit: `bun test`

---

- [ ] 10. Add command integration tests

  **What to do**:
  - Create tests for all 5 commands using mocked API
  - Test both JSON and human-readable output modes
  - Test error scenarios (not found, network errors)
  - Test flag combinations

  **Must NOT do**:
  - Don't make real API calls
  - Don't test oclif help/version (oclif handles those)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
    - Higher complexity, multiple files

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Tasks 5, 6, 7

  **References**:

  **Pattern References**:
  - `test/commands/user/info.test.ts` - Template from Task 7
  - `src/commands/user/*.ts` - Commands to test
  - `src/commands/xp/*.ts` - Commands to test

  **Files to Create**:
  - `test/commands/user/info.test.ts` - (expand from Task 7)
  - `test/commands/user/search.test.ts`
  - `test/commands/user/activity.test.ts`
  - `test/commands/xp/rank.test.ts`
  - `test/commands/xp/seasons.test.ts`

  **Test Cases per Command**:
  - Success with --json flag
  - Success with human-readable output
  - Error: user not found (404)
  - Error: network failure
  - Validation errors (where applicable)

  **Acceptance Criteria**:

  ```bash
  # Run all command tests
  bun test test/commands/
  # Assert: All tests pass, >= 25 tests total

  # Check overall coverage
  bun test --coverage
  # Assert: Overall >= 80%
  ```

  **Evidence to Capture:**
  - [ ] Test output showing all command tests pass
  - [ ] Overall coverage report showing >= 80%

  **Commit**: YES
  - Message: `test(commands): add integration tests for all 5 commands`
  - Files: `test/commands/**/*.test.ts`
  - Pre-commit: `bun test`

---

### Wave 4: New Features

- [ ] 11. Add shell completions plugin

  **What to do**:
  - Install @oclif/plugin-autocomplete
  - Add to oclif.plugins in package.json
  - Verify completions work for bash, zsh, fish
  - Add setup instructions to README

  **Must NOT do**:
  - Don't write custom completion scripts
  - Don't modify command definitions for completions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 13, 14)
  - **Blocks**: None
  - **Blocked By**: None (can start early)

  **References**:

  **External References**:
  - @oclif/plugin-autocomplete: https://github.com/oclif/plugin-autocomplete
  - oclif plugin docs: https://oclif.io/docs/plugins

  **Files to Modify**:
  - `package.json` - Add dependency and oclif plugin config
  - `README.md` - Add completion setup instructions

  **Implementation**:
  ```json
  // package.json
  {
    "dependencies": {
      "@oclif/plugin-autocomplete": "^3"
    },
    "oclif": {
      "plugins": [
        "@oclif/plugin-help",
        "@oclif/plugin-autocomplete"
      ]
    }
  }
  ```

  **Acceptance Criteria**:

  ```bash
  # Verify plugin is installed
  ./bin/dev.js autocomplete --help
  # Assert: Shows autocomplete help

  # Generate bash completions
  ./bin/dev.js autocomplete bash
  # Assert: Outputs bash completion script

  # Generate zsh completions
  ./bin/dev.js autocomplete zsh
  # Assert: Outputs zsh completion script
  ```

  **Evidence to Capture:**
  - [ ] autocomplete --help output
  - [ ] Bash completion script snippet

  **Commit**: YES
  - Message: `feat(completions): add shell completions via @oclif/plugin-autocomplete`
  - Files: `package.json`, `README.md`
  - Pre-commit: `bun install && bun run typecheck`

---

- [ ] 12. Add config file support

  **What to do**:
  - Create config loader at `src/lib/config/index.ts`
  - Read from `~/.config/ethos/config.json`
  - Support settings: environment, apiUrl, defaultOutput (json/text)
  - Environment variables override config file
  - Config file is optional (graceful when missing)

  **Must NOT do**:
  - Don't add write operations (no config set command)
  - Don't add complex config schemas
  - Don't add config validation beyond JSON parsing

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 13, 14)
  - **Blocks**: None
  - **Blocked By**: None (can start early)

  **References**:

  **Pattern References**:
  - `src/lib/api/echo-client.ts:90-93` - Current env var reading

  **Files to Create**:
  - `src/lib/config/index.ts` - Config loader

  **Files to Modify**:
  - `src/lib/api/echo-client.ts` - Use config for defaults
  - `README.md` - Document config file

  **Config Schema**:
  ```typescript
  interface EthosConfig {
    environment?: 'prod' | 'staging' | 'dev';
    apiUrl?: string;
    defaultOutput?: 'json' | 'text';
  }
  ```

  **Implementation Pattern**:
  ```typescript
  // src/lib/config/index.ts
  import { readFileSync, existsSync } from 'fs';
  import { homedir } from 'os';
  import { join } from 'path';

  const CONFIG_PATH = join(homedir(), '.config', 'ethos', 'config.json');

  export function loadConfig(): EthosConfig {
    if (!existsSync(CONFIG_PATH)) return {};
    try {
      const content = readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  ```

  **Acceptance Criteria**:

  ```bash
  # Create test config
  mkdir -p ~/.config/ethos
  echo '{"environment": "staging"}' > ~/.config/ethos/config.json

  # Verify config is read (check debug output)
  ETHOS_DEBUG=true ./bin/dev.js user info test 2>&1 | grep -i staging
  # Assert: Shows staging URL being used

  # Verify env var overrides config
  ETHOS_ENV=prod ETHOS_DEBUG=true ./bin/dev.js user info test 2>&1 | grep -i prod
  # Assert: Shows prod URL (env var wins)

  # Clean up
  rm ~/.config/ethos/config.json
  ```

  **Evidence to Capture:**
  - [ ] Debug output showing config being read
  - [ ] Environment variable override working

  **Commit**: YES
  - Message: `feat(config): add config file support at ~/.config/ethos/config.json`
  - Files: `src/lib/config/index.ts`, `src/lib/api/echo-client.ts`, `README.md`
  - Pre-commit: `bun run typecheck`

---

- [ ] 13. Add --type flag to user activity command

  **What to do**:
  - Add `--type` flag accepting 'vouch' or 'review'
  - Filter activities by type when flag is provided
  - Default: show all types (current behavior)
  - Update examples and SKILL.md

  **Must NOT do**:
  - Don't support multiple types (keep it simple)
  - Don't add 'unvouch' as a filter option

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12, 14)
  - **Blocks**: None
  - **Blocked By**: Task 10

  **References**:

  **Pattern References**:
  - `src/commands/user/activity.ts:22-38` - Current flags definition
  - `src/commands/user/activity.ts:52` - getActivities call to modify
  - `src/lib/api/echo-client.ts:233-238` - getActivities accepts types array

  **Implementation**:
  ```typescript
  // Add flag
  type: Flags.string({
    char: 't',
    description: 'Filter by activity type',
    options: ['vouch', 'review'],
  }),

  // In run()
  const types: ActivityType[] = flags.type 
    ? [flags.type as ActivityType] 
    : ['review', 'vouch'];
  const activities = await client.getActivities(userkey, types, flags.limit);
  ```

  **Acceptance Criteria**:

  ```bash
  # Test vouch filter
  ./bin/dev.js user activity 0xNowater --type vouch --json | jq '.[].type' | sort -u
  # Assert: Only "vouch" appears

  # Test review filter
  ./bin/dev.js user activity 0xNowater --type review --json | jq '.[].type' | sort -u
  # Assert: Only "review" appears

  # Test no filter (both types)
  ./bin/dev.js user activity 0xNowater --json | jq '.[].type' | sort -u
  # Assert: Both "vouch" and "review" may appear

  # Test invalid type
  ./bin/dev.js user activity 0xNowater --type invalid 2>&1
  # Assert: Error about invalid option
  ```

  **Evidence to Capture:**
  - [ ] Filtered output showing only vouches
  - [ ] Filtered output showing only reviews

  **Commit**: YES
  - Message: `feat(activity): add --type flag to filter by vouch or review`
  - Files: `src/commands/user/activity.ts`, `SKILL.md`
  - Pre-commit: `bun test`

---

- [ ] 14. Add --season flag to xp rank command

  **What to do**:
  - Add `--season` flag accepting season ID (integer)
  - Add `getXpBySeason(userkey, seasonId)` method to EchoClient
  - Show XP for specific season alongside rank
  - Update examples and SKILL.md

  **Must NOT do**:
  - Don't change default behavior (still shows current season rank)
  - Don't add season validation (API will return error for invalid)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 11, 12, 13)
  - **Blocks**: None
  - **Blocked By**: Tasks 8, 10

  **References**:

  **Pattern References**:
  - `src/commands/xp/rank.ts:22-33` - Current flags definition
  - `src/lib/api/echo-client.ts:221-226` - getXpTotal pattern to follow

  **API Endpoint**:
  - `/api/v2/xp/user/{userkey}/season/{seasonId}` - Returns XP for specific season

  **Implementation**:
  ```typescript
  // Add to EchoClient
  async getXpBySeason(userkey: string, seasonId: number): Promise<number> {
    return this.request<number>(
      `/api/v2/xp/user/${encodeURIComponent(userkey)}/season/${seasonId}`,
      'XP for Season'
    );
  }

  // Add flag to xp rank
  season: Flags.integer({
    char: 's',
    description: 'Show XP for specific season',
  }),

  // In run(), after getting rank
  if (flags.season) {
    const seasonXp = await client.getXpBySeason(userkey, flags.season);
    // Include in output
  }
  ```

  **Acceptance Criteria**:

  ```bash
  # Test with season flag
  ./bin/dev.js xp rank 0xNowater --season 2 --json | jq .seasonXp
  # Assert: Returns numeric XP for season 2

  # Test without season flag (current behavior)
  ./bin/dev.js xp rank 0xNowater --json | jq .rank
  # Assert: Returns rank (unchanged behavior)

  # Test invalid season (API error)
  ./bin/dev.js xp rank 0xNowater --season 999 2>&1
  # Assert: Shows API error (season not found or similar)
  ```

  **Evidence to Capture:**
  - [ ] JSON output with seasonXp field
  - [ ] Rank still works without --season flag

  **Commit**: YES
  - Message: `feat(xp): add --season flag to show XP for specific season`
  - Files: `src/lib/api/echo-client.ts`, `src/commands/xp/rank.ts`, `SKILL.md`
  - Pre-commit: `bun test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(commands): standardize error handling across all commands` | src/commands/**/*.ts | typecheck |
| 2 | `fix(api): add 10-second fetch timeout` | src/lib/api/echo-client.ts | typecheck |
| 3 | `refactor(output): remove unused flags parameter` | src/lib/formatting/output.ts, commands | typecheck |
| 4 | `docs(skill): remove non-existent xp balance reference` | SKILL.md | grep |
| 5 | `feat(validation): add limit bounds (1-100)` | src/commands/user/*.ts | typecheck |
| 6 | `refactor(commands): remove unreachable throw statements` | src/commands/**/*.ts | typecheck |
| 7 | `test(infra): add command testing infrastructure` | test/commands/, test/helpers/ | bun test |
| 8 | `test(api): add comprehensive EchoClient tests` | test/lib/api/echo-client.test.ts | bun test |
| 9 | `test(formatting): add output formatter tests` | test/lib/formatting/output.test.ts | bun test |
| 10 | `test(commands): add integration tests for all commands` | test/commands/**/*.test.ts | bun test |
| 11 | `feat(completions): add shell completions plugin` | package.json, README.md | autocomplete --help |
| 12 | `feat(config): add config file support` | src/lib/config/, README.md | typecheck |
| 13 | `feat(activity): add --type flag` | src/commands/user/activity.ts, SKILL.md | bun test |
| 14 | `feat(xp): add --season flag` | src/lib/api/echo-client.ts, src/commands/xp/rank.ts | bun test |

---

## Success Criteria

### Verification Commands
```bash
# All tests pass with 80%+ coverage
bun test --coverage
# Expected: All tests pass, >= 80% coverage

# Shell completions work
./bin/dev.js autocomplete bash
# Expected: Outputs bash completion script

# Config file is read
mkdir -p ~/.config/ethos && echo '{"environment":"staging"}' > ~/.config/ethos/config.json
ETHOS_DEBUG=true ./bin/dev.js user info test 2>&1 | grep staging
# Expected: Shows staging URL

# Activity type filtering works
./bin/dev.js user activity 0xNowater --type vouch --limit 3
# Expected: Only vouch activities shown

# XP by season works
./bin/dev.js xp rank 0xNowater --season 2
# Expected: Shows rank and season XP

# Validation works
./bin/dev.js user search test --limit 0 2>&1
# Expected: Error about limit bounds

# Timeout works
ETHOS_API_URL=http://10.255.255.1 timeout 15 ./bin/dev.js user info test 2>&1
# Expected: Timeout error within ~12 seconds
```

### Final Checklist
- [ ] All 6 critical issues fixed
- [ ] Test coverage >= 80%
- [ ] Shell completions working (bash, zsh, fish)
- [ ] Config file support working
- [ ] --type flag on activity command
- [ ] --season flag on xp rank command
- [ ] SKILL.md updated (xp balance removed)
- [ ] No breaking changes to existing commands
- [ ] All commits pass pre-commit checks
