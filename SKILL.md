# Ethos CLI - LLM Agent Integration Guide

Use this guide when working with the Ethos CLI programmatically or in LLM agent workflows.

## Overview

The Ethos CLI is designed for both human and LLM agent use:
- All commands support `--json` flag for structured output
- Semantic exit codes for programmatic error handling
- Environment variables for configuration
- Stable output schemas (versioned with package)

## Installation

```bash
npm install -g @ethos/cli
# or
bun install -g @ethos/cli
```

## Command Reference

### User Commands

#### `ethos user info <identifier>`

Get detailed user profile information.

**Arguments:**
- `identifier` - Username, Ethereum address, or userkey

**Flags:**
- `-j, --json` - Output as JSON

**Exit Codes:**
- `0` - User found
- `1` - User not found or API error
- `2` - Invalid arguments

**JSON Output Schema:**
```json
{
  "id": 123,
  "username": "vitalik.eth",
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "score": 1850,
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

**Example Usage:**
```bash
# Human-readable output
ethos user info vitalik.eth

# JSON output for parsing
ethos user info vitalik.eth --json | jq .username

# By Ethereum address
ethos user info address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --json
```

#### `ethos user search <query>`

Search for users by name, username, or partial address.

**Arguments:**
- `query` - Search query string

**Flags:**
- `-j, --json` - Output as JSON
- `-l, --limit <number>` - Maximum results (default: 10)

**Exit Codes:**
- `0` - Search completed (even if no results)
- `1` - API error
- `2` - Invalid arguments

**JSON Output Schema:**
```json
[
  {
    "id": 123,
    "username": "vitalik.eth",
    "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "score": 1850
  }
]
```

**Example Usage:**
```bash
# Search with default limit
ethos user search "crypto developer" --json

# Custom limit
ethos user search vitalik --limit 5 --json | jq length

# Get first result
ethos user search "web3" --json | jq '.[0].username'
```

### XP Commands

#### `ethos xp seasons`

List all XP seasons.

**Flags:**
- `-j, --json` - Output as JSON

**Exit Codes:**
- `0` - Seasons retrieved
- `1` - API error

**JSON Output Schema:**
```json
[
  {
    "id": 2,
    "season": 2,
    "name": "Season 2",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.999Z"
  }
]
```

**Example Usage:**
```bash
# List all seasons
ethos xp seasons --json

# Get current season (last in array)
ethos xp seasons --json | jq '.[-1]'

# Count seasons
ethos xp seasons --json | jq 'length'
```

#### `ethos xp rank <userkey>`

Get user's leaderboard rank.

**Arguments:**
- `userkey` - Username, address, or userkey identifier

**Flags:**
- `-j, --json` - Output as JSON

**Exit Codes:**
- `0` - Rank retrieved
- `1` - User not found or API error
- `2` - Invalid arguments

**JSON Output Schema:**
```json
{
  "rank": 42,
  "totalXp": 15000
}
```

**Example Usage:**
```bash
# Get rank
ethos xp rank vitalik.eth --json | jq .rank

# Get both rank and XP
ethos xp rank vitalik.eth --json | jq '{rank, totalXp}'
```

## User Key Formats

The CLI automatically detects and formats user identifiers:

| Format | Example | Auto-Detected |
|--------|---------|--------------|
| Username | `vitalik.eth` | ✅ |
| Ethereum Address | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` | ✅ (prefixed with `address:`) |
| Address (explicit) | `address:0xd8dA...` | ✅ |
| Discord | `service:discord:123456789` | ✅ |
| Twitter ID | `service:x.com:123456789` | ✅ |
| Twitter Username | `service:x.com:username:elonmusk` | ✅ |

## Environment Configuration

Control CLI behavior via environment variables:

```bash
# Use staging environment
export ETHOS_ENV=staging
ethos user info vitalik.eth

# Custom API endpoint
export ETHOS_API_URL=http://localhost:4000
ethos user info vitalik.eth

# Default to JSON output
export ETHOS_OUTPUT=json
ethos user info vitalik.eth
```

**Available Environments:**
- `prod` (default) - Production API at `https://echo.ethos.network`
- `staging` - Staging API at `https://echo-staging.ethos.network`
- `dev` - Local development at `http://localhost:4000`

## Error Handling

The CLI uses semantic exit codes for programmatic handling:

```bash
# Check if user exists
if ethos user info vitalik.eth --json > /dev/null 2>&1; then
  echo "User exists"
else
  echo "User not found or error"
fi

# Get exit code
ethos user info vitalik.eth --json
echo $?  # 0 = success, 1 = error, 2 = invalid usage
```

## Output Stability Guarantees

**Version Compatibility:**
- Minor version bumps (1.x.0) may add new fields to JSON output
- Major version bumps (x.0.0) may change or remove fields
- Always specify version in package.json for production use

**Safe to rely on:**
- Field names and types within the same major version
- Exit code semantics
- Command names and argument structure

**May change between versions:**
- Human-readable text formatting
- Color codes and styling
- Error message wording

## Common Agent Workflows

### Workflow 1: User Lookup

```bash
# Get user ID from username
USER_ID=$(ethos user info vitalik.eth --json | jq -r .id)

# Check if user has high score
SCORE=$(ethos user info vitalik.eth --json | jq -r .score)
if [ "$SCORE" -gt 1000 ]; then
  echo "High reputation user"
fi
```

### Workflow 2: User Score Check

```bash
# Get user score
SCORE=$(ethos user info vitalik.eth --json | jq -r .score)

# Compare with threshold
if [ "$SCORE" -gt 1000 ]; then
  echo "User has high reputation"
fi
```

### Workflow 3: Leaderboard Position

```bash
# Get rank
RANK=$(ethos xp rank vitalik.eth --json | jq -r .rank)

# Check if in top 100
if [ "$RANK" -le 100 ]; then
  echo "Top 100 user"
fi
```

### Workflow 4: Search and Filter

```bash
# Search for users and filter by score
ethos user search "crypto" --limit 20 --json | \
  jq '[.[] | select(.score > 1000)] | .[0:5]'
```

## Version Information

Check CLI version:
```bash
ethos --version
# @ethos/cli/1.0.0 darwin-arm64 node-v24.13.0
```

## Performance Considerations

**Cold Start Time:**
- First execution: ~300ms with Bun, ~500ms with Node.js
- Warm execution: ~100ms

**Rate Limiting:**
- No rate limits on public API (subject to change)
- Use `ETHOS_API_URL` for custom endpoints with auth

**Caching:**
- CLI does not cache results
- Implement your own caching if needed for frequent queries

## Troubleshooting

**Common Issues:**

1. **Command not found**
   ```bash
   # Verify installation
   which ethos
   # Reinstall if needed
   npm install -g @ethos/cli
   ```

2. **API errors**
   ```bash
   # Check environment
   echo $ETHOS_ENV
   # Test with staging
   ETHOS_ENV=staging ethos user info test
   ```

3. **Invalid JSON output**
   ```bash
   # Ensure --json flag is used
   ethos user info vitalik.eth --json | jq .
   ```

## Support

- GitHub Issues: https://github.com/ethos-network/ethos-cli/issues
- Documentation: https://docs.ethos.network
- API Reference: https://docs.ethos.network/api
