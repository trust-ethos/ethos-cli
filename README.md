# @ethos/cli

Official Ethos CLI - Query user profiles, XP balances, and reputation data

[![npm version](https://img.shields.io/npm/v/@ethos/cli.svg)](https://www.npmjs.com/package/@ethos/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

### npm (Recommended for developers)

```bash
npm install -g @ethos/cli
# or
bun install -g @ethos/cli
```

### Homebrew (Coming soon)

```bash
brew tap ethos-network/tap
brew install ethos
```

### Curl Install (Coming soon)

```bash
curl -fsSL https://ethos.network/install | bash
```

### From Source

```bash
git clone https://github.com/ethos-network/ethos-cli.git
cd ethos-cli
bun install
bun run build
npm link
```

To unlink: `npm unlink -g @ethos/cli`

## Usage

### User Commands

**Get user profile** (includes score, XP, stats)
```bash
ethos user info 0xNowater              # Twitter username
ethos user info vitalik.eth            # ENS name
ethos user info 0xd8dA6BF2...          # ETH address
ethos user info 0xNowater --json       # JSON output
```

**Search for users**
```bash
ethos user search vitalik
ethos user search "crypto developer" --limit 5
ethos user search web3 --json
```

### XP Commands

**List XP seasons**
```bash
ethos xp seasons
ethos xp seasons --json
```

**Check leaderboard rank**
```bash
ethos xp rank 0xNowater
ethos xp rank vitalik.eth --json
```

## Identifier Formats

The CLI intelligently detects identifier types:

| Format | Example | Detection |
|--------|---------|-----------|
| Twitter username | `0xNowater` | Default (plain text) |
| ETH address | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` | 0x + 40 hex chars |
| ENS name | `vitalik.eth` | Ends with .eth |
| Explicit prefix | `twitter:name`, `address:0x...`, `profileId:21` | Colon-prefixed |

## JSON Output

All commands support `--json` (or `-j`) flag for machine-readable output:

```bash
ethos user info 0xNowater --json | jq .score
ethos user search vitalik --json | jq '.values[0].username'
ethos xp rank 0xNowater --json | jq .rank
```

## Shell Completions

Generate shell completions for your shell:

```bash
# Bash
ethos autocomplete bash

# Zsh
ethos autocomplete zsh

# Fish
ethos autocomplete fish
```

Follow the printed instructions to add completions to your shell.

## Configuration

Create `~/.config/ethos/config.json` to set defaults:

```json
{
  "environment": "prod",
  "apiUrl": "https://api.ethos.network",
  "defaultOutput": "text"
}
```

All fields are optional. Environment variables override config file settings.

## Environment Variables

- `ETHOS_ENV` - Override environment (prod|staging|dev)
- `ETHOS_API_URL` - Override API endpoint for testing
- `ETHOS_OUTPUT` - Output format (json|text)

**Priority order** (highest to lowest):
1. Environment variables
2. Config file (`~/.config/ethos/config.json`)
3. Defaults (prod environment, standard API URL)

## Exit Codes

- `0` - Success
- `1` - Runtime error (API failure, not found)
- `2` - Invalid usage (missing args, validation error)

## Development

### Setup

```bash
git clone https://github.com/ethos-network/ethos-cli.git
cd ethos-cli
bun install
```

### Commands

```bash
bun run dev              # Run CLI in development mode
bun run build            # Build TypeScript
bun test                 # Run tests
bun run test:watch       # Run tests in watch mode
bun run typecheck        # Type check without building
bun run lint             # Lint code
bun run readme           # Generate README command reference
```

### Project Structure

```
ethos-cli/
├── src/
│   ├── commands/        # Command implementations
│   │   ├── user/        # User-related commands
│   │   └── xp/          # XP-related commands
│   ├── lib/
│   │   ├── api/         # API client
│   │   ├── formatting/  # Output formatting
│   │   └── validation/  # Input validation
│   └── index.ts
├── test/                # Test files
├── bin/                 # Entry points
└── dist/                # Built output
```

## LLM Agent Integration

This CLI is designed to be agent-friendly:

- All commands support `--json` for structured output
- Semantic exit codes for programmatic error handling
- Environment variables for configuration
- Stable output schemas (versioned with package)

See [SKILL.md](./SKILL.md) for detailed LLM agent integration guide.

## Contributing

Contributions are welcome! Please read [CLAUDE.md](./CLAUDE.md) for development guidelines.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Links

- [Ethos Network](https://ethos.network)
- [GitHub Repository](https://github.com/ethos-network/ethos-cli)
- [npm Package](https://www.npmjs.com/package/@ethos/cli)
- [Documentation](https://docs.ethos.network)

<!-- toc -->
* [@ethos/cli](#ethoscli)
* [or](#or)
* [Bash](#bash)
* [Zsh](#zsh)
* [Fish](#fish)
<!-- tocstop -->
<!-- usage -->
```sh-session
$ npm install -g @ethos/cli
$ ethos COMMAND
running command...
$ ethos (--version)
@ethos/cli/1.0.0 darwin-arm64 node-v24.13.0
$ ethos --help [COMMAND]
USAGE
  $ ethos COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`ethos autocomplete [SHELL]`](#ethos-autocomplete-shell)
* [`ethos broker info ID`](#ethos-broker-info-id)
* [`ethos broker list`](#ethos-broker-list)
* [`ethos help [COMMAND]`](#ethos-help-command)
* [`ethos listing info IDENTIFIER`](#ethos-listing-info-identifier)
* [`ethos listing list`](#ethos-listing-list)
* [`ethos listing voters PROJECTID`](#ethos-listing-voters-projectid)
* [`ethos slash info ID`](#ethos-slash-info-id)
* [`ethos slash list`](#ethos-slash-list)
* [`ethos user activity IDENTIFIER`](#ethos-user-activity-identifier)
* [`ethos user info IDENTIFIER`](#ethos-user-info-identifier)
* [`ethos user search QUERY`](#ethos-user-search-query)
* [`ethos xp rank IDENTIFIER`](#ethos-xp-rank-identifier)
* [`ethos xp seasons`](#ethos-xp-seasons)

## `ethos autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ ethos autocomplete [SHELL] [-r]

ARGUMENTS
  [SHELL]  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ ethos autocomplete

  $ ethos autocomplete bash

  $ ethos autocomplete zsh

  $ ethos autocomplete powershell

  $ ethos autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.40/src/commands/autocomplete/index.ts)_

## `ethos broker info ID`

Get details of a specific broker post

```
USAGE
  $ ethos broker info ID [-j] [-v]

ARGUMENTS
  ID  Broker post ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific broker post

EXAMPLES
  $ ethos broker info 123

  $ ethos broker info 123 --json
```

_See code: [src/commands/broker/info.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/broker/info.ts)_

## `ethos broker list`

List broker posts (jobs, services, bounties)

```
USAGE
  $ ethos broker list [-j] [-v] [-t sell|buy|hire|for-hire|bounty] [-s <value>] [--sort newest|top|hot] [-l
    <value>]

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results
  -s, --search=<value>  Search in title/description
  -t, --type=<option>   Filter by post type
                        <options: sell|buy|hire|for-hire|bounty>
  -v, --verbose         Show detailed error information
      --sort=<option>   [default: hot] Sort order
                        <options: newest|top|hot>

DESCRIPTION
  List broker posts (jobs, services, bounties)

EXAMPLES
  $ ethos broker list

  $ ethos broker list --type hire

  $ ethos broker list --search "solidity developer"

  $ ethos broker list --type sell --limit 5 --json
```

_See code: [src/commands/broker/list.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/broker/list.ts)_

## `ethos help [COMMAND]`

Display help for ethos.

```
USAGE
  $ ethos help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for ethos.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.37/src/commands/help.ts)_

## `ethos listing info IDENTIFIER`

Get details of a specific listing/project

```
USAGE
  $ ethos listing info IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Project ID or username

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific listing/project

EXAMPLES
  $ ethos listing info 123

  $ ethos listing info uniswap

  $ ethos listing info uniswap --json
```

_See code: [src/commands/listing/info.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/listing/info.ts)_

## `ethos listing list`

List projects on Ethos Listings

```
USAGE
  $ ethos listing list [-j] [-v] [--status active|pending|archived] [-l <value>]

FLAGS
  -j, --json             Output as JSON
  -l, --limit=<value>    [default: 10] Max results
  -v, --verbose          Show detailed error information
      --status=<option>  [default: active] Filter by status
                         <options: active|pending|archived>

DESCRIPTION
  List projects on Ethos Listings

EXAMPLES
  $ ethos listing list

  $ ethos listing list --status active

  $ ethos listing list --limit 20 --json
```

_See code: [src/commands/listing/list.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/listing/list.ts)_

## `ethos listing voters PROJECTID`

Show voters for a listing/project

```
USAGE
  $ ethos listing voters PROJECTID [-j] [-v] [--sentiment bullish|bearish] [-l <value>]

ARGUMENTS
  PROJECTID  Project ID

FLAGS
  -j, --json                Output as JSON
  -l, --limit=<value>       [default: 10] Max results
  -v, --verbose             Show detailed error information
      --sentiment=<option>  Filter by sentiment
                            <options: bullish|bearish>

DESCRIPTION
  Show voters for a listing/project

EXAMPLES
  $ ethos listing voters 123

  $ ethos listing voters 123 --sentiment bullish

  $ ethos listing voters 123 --limit 20 --json
```

_See code: [src/commands/listing/voters.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/listing/voters.ts)_

## `ethos slash info ID`

Get details of a specific slash

```
USAGE
  $ ethos slash info ID [-j] [-v]

ARGUMENTS
  ID  Slash ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific slash

EXAMPLES
  $ ethos slash info 123

  $ ethos slash info 123 --json
```

_See code: [src/commands/slash/info.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/slash/info.ts)_

## `ethos slash list`

List reputation slashes

```
USAGE
  $ ethos slash list [-j] [-v] [--status open|closed] [--author <value>] [--subject <value>] [-l <value>]

FLAGS
  -j, --json             Output as JSON
  -l, --limit=<value>    [default: 10] Max results
  -v, --verbose          Show detailed error information
      --author=<value>   Filter by slasher userkey
      --status=<option>  Filter by status
                         <options: open|closed>
      --subject=<value>  Filter by subject userkey

DESCRIPTION
  List reputation slashes

EXAMPLES
  $ ethos slash list

  $ ethos slash list --status open

  $ ethos slash list --subject twitter:0xNowater

  $ ethos slash list --limit 5 --json
```

_See code: [src/commands/slash/list.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/slash/list.ts)_

## `ethos user activity IDENTIFIER`

Show recent reviews and vouches for a user

```
USAGE
  $ ethos user activity IDENTIFIER [-j] [-l <value>] [-t vouch|review] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Maximum number of activities
  -t, --type=<option>  Filter by activity type
                       <options: vouch|review>
  -v, --verbose        Show detailed error information

DESCRIPTION
  Show recent reviews and vouches for a user

EXAMPLES
  $ ethos user activity 0xNowater

  $ ethos user activity 0xNowater --type vouch

  $ ethos user activity 0xNowater --type review --limit 5

  $ ethos user activity 0xNowater --json
```

_See code: [src/commands/user/activity.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/user/activity.ts)_

## `ethos user info IDENTIFIER`

Display user profile by username, address, or ENS name

```
USAGE
  $ ethos user info IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Display user profile by username, address, or ENS name

EXAMPLES
  $ ethos user info 0xNowater

  $ ethos user info 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos user info vitalik.eth

  $ ethos user info 0xNowater --json
```

_See code: [src/commands/user/info.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/user/info.ts)_

## `ethos user search QUERY`

Search for users by name, username, or address

```
USAGE
  $ ethos user search QUERY [-j] [-l <value>] [-v]

ARGUMENTS
  QUERY  Search query

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Maximum number of results
  -v, --verbose        Show detailed error information

DESCRIPTION
  Search for users by name, username, or address

EXAMPLES
  $ ethos user search vitalik

  $ ethos user search "crypto developer"

  $ ethos user search vitalik --json

  $ ethos user search web3 --limit 5
```

_See code: [src/commands/user/search.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/user/search.ts)_

## `ethos xp rank IDENTIFIER`

Show leaderboard rank for a user

```
USAGE
  $ ethos xp rank IDENTIFIER [-j] [-s <value>] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json            Output as JSON
  -s, --season=<value>  Show XP for specific season
  -v, --verbose         Show detailed error information

DESCRIPTION
  Show leaderboard rank for a user

EXAMPLES
  $ ethos xp rank 0xNowater

  $ ethos xp rank 0xNowater --season 2

  $ ethos xp rank 0xNowater --json
```

_See code: [src/commands/xp/rank.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/xp/rank.ts)_

## `ethos xp seasons`

List all XP seasons

```
USAGE
  $ ethos xp seasons [-j] [-v]

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  List all XP seasons

EXAMPLES
  $ ethos xp seasons

  $ ethos xp seasons --json
```

_See code: [src/commands/xp/seasons.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/xp/seasons.ts)_
<!-- commandsstop -->
