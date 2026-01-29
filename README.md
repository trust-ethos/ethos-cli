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

## Usage

### User Commands

**Get user information**
```bash
ethos user info vitalik.eth
ethos user info address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
ethos user info vitalik.eth --json
```

**Search for users**
```bash
ethos user search "crypto developer"
ethos user search vitalik --json
ethos user search "web3" --limit 5
```

### XP Commands

**Check XP balance**
```bash
ethos xp balance vitalik.eth
ethos xp balance address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
ethos xp balance vitalik.eth --json
```

**List XP seasons**
```bash
ethos xp seasons
ethos xp seasons --json
```

**Check leaderboard rank**
```bash
ethos xp rank vitalik.eth
ethos xp rank address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
ethos xp rank vitalik.eth --json
```

## User Key Formats

The CLI accepts various user identifier formats:

- **Username**: `vitalik.eth`
- **Ethereum Address**: `address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` or `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
- **Discord**: `service:discord:<discordUserId>`
- **Twitter**: `service:x.com:<twitterUserId>` or `service:x.com:username:<twitterUsername>`

## JSON Output

All commands support `--json` (or `-j`) flag for machine-readable output:

```bash
ethos user info vitalik.eth --json | jq .username
ethos xp balance vitalik.eth --json | jq .totalXp
```

## Environment Variables

- `ETHOS_ENV` - Environment (prod|staging|dev), defaults to prod
- `ETHOS_API_URL` - Custom API endpoint for testing
- `ETHOS_OUTPUT` - Output format (json|text)

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
* [`ethos help [COMMAND]`](#ethos-help-command)
* [`ethos user info IDENTIFIER`](#ethos-user-info-identifier)
* [`ethos user search QUERY`](#ethos-user-search-query)
* [`ethos xp balance USERKEY`](#ethos-xp-balance-userkey)
* [`ethos xp rank USERKEY`](#ethos-xp-rank-userkey)
* [`ethos xp seasons`](#ethos-xp-seasons)

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

## `ethos user info IDENTIFIER`

Display user profile by username or address

```
USAGE
  $ ethos user info IDENTIFIER [-j]

ARGUMENTS
  IDENTIFIER  Username or Ethereum address

FLAGS
  -j, --json  Output as JSON

DESCRIPTION
  Display user profile by username or address

EXAMPLES
  $ ethos user info vitalik.eth

  $ ethos user info address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos user info vitalik.eth --json
```

_See code: [src/commands/user/info.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/user/info.ts)_

## `ethos user search QUERY`

Search for users by name, username, or address

```
USAGE
  $ ethos user search QUERY [-j] [-l <value>]

ARGUMENTS
  QUERY  Search query

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Maximum number of results

DESCRIPTION
  Search for users by name, username, or address

EXAMPLES
  $ ethos user search "crypto developer"

  $ ethos user search vitalik --json

  $ ethos user search "web3" --limit 5
```

_See code: [src/commands/user/search.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/user/search.ts)_

## `ethos xp balance USERKEY`

Check total XP balance for a user

```
USAGE
  $ ethos xp balance USERKEY [-j]

ARGUMENTS
  USERKEY  Username, address, or userkey identifier

FLAGS
  -j, --json  Output as JSON

DESCRIPTION
  Check total XP balance for a user

EXAMPLES
  $ ethos xp balance vitalik.eth

  $ ethos xp balance address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos xp balance vitalik.eth --json
```

_See code: [src/commands/xp/balance.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/xp/balance.ts)_

## `ethos xp rank USERKEY`

Show leaderboard rank for a user

```
USAGE
  $ ethos xp rank USERKEY [-j]

ARGUMENTS
  USERKEY  Username, address, or userkey identifier

FLAGS
  -j, --json  Output as JSON

DESCRIPTION
  Show leaderboard rank for a user

EXAMPLES
  $ ethos xp rank vitalik.eth

  $ ethos xp rank address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos xp rank vitalik.eth --json
```

_See code: [src/commands/xp/rank.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/xp/rank.ts)_

## `ethos xp seasons`

List all XP seasons

```
USAGE
  $ ethos xp seasons [-j]

FLAGS
  -j, --json  Output as JSON

DESCRIPTION
  List all XP seasons

EXAMPLES
  $ ethos xp seasons

  $ ethos xp seasons --json
```

_See code: [src/commands/xp/seasons.ts](https://github.com/ethos-network/ethos-cli/blob/v1.0.0/src/commands/xp/seasons.ts)_
<!-- commandsstop -->
