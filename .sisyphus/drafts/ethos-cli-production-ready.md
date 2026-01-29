# Draft: Ethos CLI Production-Ready Plan

## Requirements (confirmed)
- Fix critical issues found in analysis (error handling, dead code, validation)
- Achieve 80% test coverage (from ~15% currently)
- Add shell completions (bash, zsh, fish)
- Add config file support (~/.config/ethos/config.json)
- Add leaderboard command
- Add input validation with bounds
- Add request timeouts
- Add activity type filtering
- Better verbose/debug output
- READ-only operations only
- Use API v2 endpoints only
- Maintain backward compatibility
- Work with both npm and bun

## Current State Analysis

### Existing Commands (5 working)
1. `user info` - Display user profile (works)
2. `user search` - Search for users (works)
3. `user activity` - Show recent reviews/vouches (works)
4. `xp rank` - Show leaderboard rank (works)
5. `xp seasons` - List XP seasons (works)

### Critical Issues Found
1. **Inconsistent error handling**: Commands use `this.log() + this.exit()` instead of `this.error()`
2. **Dead code**: Unreachable `throw error` after catch blocks (lines 53 in info.ts, similar in others)
3. **Unused parameter**: `_flags` in output.ts line 4 (underscore indicates unused but still passed)
4. **No input validation**: `limit` flag can be negative or huge
5. **No fetch timeout**: API requests can hang indefinitely
6. **SKILL.md issue**: References `xp balance` command that doesn't exist

### Current Test Coverage
- `test/lib/validation/userkey.test.ts` - Validation tests only
- `test/lib/api/echo-client.test.ts` - Only tests client instantiation (3 trivial tests)
- **0%** command tests
- **0%** error handling tests
- **0%** output formatting tests

### API Client Methods Available
- `getUserByTwitter(username)`
- `getUserByAddress(address)`
- `getUserByProfileId(profileId)`
- `searchUsers(query, limit)`
- `resolveUser(identifier)` - dispatches to correct method
- `getXpTotal(userkey)`
- `getSeasons()`
- `getLeaderboardRank(userkey)`
- `getActivities(userkey, types, limit)`

### Missing API Integrations
- Leaderboard top N (endpoint exists but not exposed)
- XP by season
- Score breakdown (via links.scoreBreakdown)

## Technical Decisions (Recommendations)
- Shell completions: **@oclif/plugin-autocomplete** (official oclif plugin, auto-generates)
- Config file location: **~/.config/ethos/config.json** (XDG standard)
- Testing approach: **TDD** (write tests first for new code, add tests for existing)
- Test framework: **@oclif/test + bun test** (oclif's test utilities with bun runner)
- Request timeout: **10 seconds** (good balance for API calls)
- Limit bounds: **1-100** (min 1, max 100 for pagination)

## Research Findings

### Codebase Exploration (Complete)
- 5 commands follow consistent pattern: `Command` class, static args/flags, try/catch error handling
- Error handling uses `this.log(formatError()) + this.exit(1)` pattern (not `this.error()`)
- EchoClient has 11 methods, all use `/api/v2/` endpoints
- Only 2 test files exist with 16 total tests (all validation/instantiation, no integration)
- Output formatting uses picocolors, 7 formatter functions
- 4 custom error classes with suggestions arrays
- No config file handling exists currently
- No shell completions currently

### Oclif Best Practices (Pending librarian)

## Open Questions (Need User Input)
1. **XP Balance command**: SKILL.md references `xp balance` that doesn't exist. Add the command or remove reference?
2. **Leaderboard endpoint**: Need to verify API endpoint exists for top N leaderboard
3. **Activity type filter**: Should `--type` flag accept single value or multiple (e.g., `--type vouch,review`)?

## Scope Boundaries
- INCLUDE: All 6 critical fixes, test coverage to 80%, shell completions, config file
- INCLUDE: Leaderboard command, input validation, request timeouts
- EXCLUDE: Write operations (reviews, vouches)
- EXCLUDE: GraphQL support
- EXCLUDE: Caching layer
- EXCLUDE: Binary builds (separate phase)
