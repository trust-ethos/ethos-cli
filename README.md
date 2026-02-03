# @trust-ethos/cli

```text
      .............         ..........     ..  ...                              
       ............         ...     ..    ..    ..                              
.........                   ...      .  ......  .. ....       .....      ...... 
.........                   ...     .     .. .  ...  .....  ...   ...  ..    .. 
         ..........         .........     ..    ..     ... ...     ... ...    . 
         ..........         ...   ...     ..    ..     ... ...      ..  .....   
..........                  ...           ..    ..     ... ...      ..     .... 
.........                   ...       ..  ..    ..     ... ...     ... .     ...
       ............         ...      ..   ..    ..     ...  ...    ..  ..    ...
      .............         ...........  ....  ....    ...   .......   ........ 

```

Official Ethos CLI - Query user profiles, XP balances, and reputation data

[![npm version](https://img.shields.io/npm/v/@trust-ethos/cli.svg)](https://www.npmjs.com/package/@trust-ethos/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/trust-ethos/ethos-cli/main/scripts/install.sh | sh
```

This installs the CLI to `~/.ethos/` and **automatically keeps it up to date**.

### npm

```bash
npm install -g @trust-ethos/cli
# or
bun install -g @trust-ethos/cli
```

### Homebrew

```bash
brew tap trust-ethos/tap
brew install ethos
```

### From Source

```bash
git clone https://github.com/trust-ethos/ethos-cli.git
cd ethos-cli
bun install
bun run build
npm link
```

To unlink: `npm unlink -g @trust-ethos/cli`

## Updates

The CLI handles updates differently depending on how you installed it:

| Install Method | Update Behavior |
|----------------|-----------------|
| **curl** | Auto-updates silently in the background |
| **npm** | Shows update notification, run `npm update -g @trust-ethos/cli` |
| **Homebrew** | Shows update notification, run `brew upgrade ethos` |

For curl installs, updates are checked daily and applied automatically on the next CLI run.

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

Configure the CLI using the `config` command:

```bash
# Show current configuration
ethos config get

# Set the API URL
ethos config set apiUrl=https://api.ethos.network

# Show config file path
ethos config path
```

The config file is stored at `~/.config/ethos/config.json`.

## Exit Codes

- `0` - Success
- `1` - Runtime error (API failure, not found)
- `2` - Invalid usage (missing args, validation error)

## Development

### Setup

```bash
git clone https://github.com/trust-ethos/ethos-cli.git
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
- [GitHub Repository](https://github.com/trust-ethos/ethos-cli)
- [npm Package](https://www.npmjs.com/package/@trust-ethos/cli)
- [Documentation](https://docs.ethos.network)

<!-- toc -->
* [@trust-ethos/cli](#trust-ethoscli)
* [or](#or)
* [Bash](#bash)
* [Zsh](#zsh)
* [Fish](#fish)
* [Show current configuration](#show-current-configuration)
* [Set the API URL](#set-the-api-url)
* [Show config file path](#show-config-file-path)
<!-- tocstop -->
<!-- usage -->
```sh-session
$ npm install -g @trust-ethos/cli
$ ethos COMMAND
running command...
$ ethos (--version)
@trust-ethos/cli/0.0.12 darwin-arm64 node-v24.13.0
$ ethos --help [COMMAND]
USAGE
  $ ethos COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`ethos auction active`](#ethos-auction-active)
* [`ethos auction info ID`](#ethos-auction-info-id)
* [`ethos auction list`](#ethos-auction-list)
* [`ethos autocomplete [SHELL]`](#ethos-autocomplete-shell)
* [`ethos broker info ID`](#ethos-broker-info-id)
* [`ethos broker list`](#ethos-broker-list)
* [`ethos config get`](#ethos-config-get)
* [`ethos config path`](#ethos-config-path)
* [`ethos config set VALUE`](#ethos-config-set-value)
* [`ethos find QUERY`](#ethos-find-query)
* [`ethos help [COMMAND]`](#ethos-help-command)
* [`ethos listing info IDENTIFIER`](#ethos-listing-info-identifier)
* [`ethos listing list`](#ethos-listing-list)
* [`ethos listing voters PROJECTID`](#ethos-listing-voters-projectid)
* [`ethos market featured`](#ethos-market-featured)
* [`ethos market holders IDENTIFIER`](#ethos-market-holders-identifier)
* [`ethos market info IDENTIFIER`](#ethos-market-info-identifier)
* [`ethos market list`](#ethos-market-list)
* [`ethos mi IDENTIFIER`](#ethos-mi-identifier)
* [`ethos ml`](#ethos-ml)
* [`ethos nft list IDENTIFIER`](#ethos-nft-list-identifier)
* [`ethos rank IDENTIFIER`](#ethos-rank-identifier)
* [`ethos review info ID`](#ethos-review-info-id)
* [`ethos review list IDENTIFIER`](#ethos-review-list-identifier)
* [`ethos review votes ID`](#ethos-review-votes-id)
* [`ethos ri ID`](#ethos-ri-id)
* [`ethos rl IDENTIFIER`](#ethos-rl-identifier)
* [`ethos score status IDENTIFIER`](#ethos-score-status-identifier)
* [`ethos skill install`](#ethos-skill-install)
* [`ethos slash info ID`](#ethos-slash-info-id)
* [`ethos slash list`](#ethos-slash-list)
* [`ethos slash votes ID`](#ethos-slash-votes-id)
* [`ethos u IDENTIFIER`](#ethos-u-identifier)
* [`ethos ui IDENTIFIER`](#ethos-ui-identifier)
* [`ethos update`](#ethos-update)
* [`ethos us IDENTIFIER`](#ethos-us-identifier)
* [`ethos user activity IDENTIFIER`](#ethos-user-activity-identifier)
* [`ethos user info IDENTIFIER`](#ethos-user-info-identifier)
* [`ethos user invitations IDENTIFIER`](#ethos-user-invitations-identifier)
* [`ethos user search QUERY`](#ethos-user-search-query)
* [`ethos user summary IDENTIFIER`](#ethos-user-summary-identifier)
* [`ethos validator info TOKENID`](#ethos-validator-info-tokenid)
* [`ethos validator list`](#ethos-validator-list)
* [`ethos validator sales`](#ethos-validator-sales)
* [`ethos vi ID`](#ethos-vi-id)
* [`ethos vl [IDENTIFIER]`](#ethos-vl-identifier)
* [`ethos vouch info ID`](#ethos-vouch-info-id)
* [`ethos vouch list [IDENTIFIER]`](#ethos-vouch-list-identifier)
* [`ethos vouch mutual TARGET VIEWER`](#ethos-vouch-mutual-target-viewer)
* [`ethos vouch votes ID`](#ethos-vouch-votes-id)
* [`ethos xp rank IDENTIFIER`](#ethos-xp-rank-identifier)
* [`ethos xp seasons`](#ethos-xp-seasons)

## `ethos auction active`

Show the currently active auction

```
USAGE
  $ ethos auction active [-j] [-v]

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Show the currently active auction

EXAMPLES
  $ ethos auction active

  $ ethos auction active --json
```

_See code: [src/commands/auction/active.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/auction/active.ts)_

## `ethos auction info ID`

Get details of a specific auction

```
USAGE
  $ ethos auction info ID [-j] [-v]

ARGUMENTS
  ID  Auction ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific auction

EXAMPLES
  $ ethos auction info 1

  $ ethos auction info 1 --json
```

_See code: [src/commands/auction/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/auction/info.ts)_

## `ethos auction list`

List validator NFT auctions

```
USAGE
  $ ethos auction list [-j] [-v] [-l <value>] [-o <value>] [--status pending|active|ended|settled]

FLAGS
  -j, --json             Output as JSON
  -l, --limit=<value>    [default: 10] Max results per request
  -o, --offset=<value>   Number of results to skip
  -v, --verbose          Show detailed error information
      --status=<option>  Filter by status
                         <options: pending|active|ended|settled>

DESCRIPTION
  List validator NFT auctions

EXAMPLES
  $ ethos auction list

  $ ethos auction list --status active

  $ ethos auction list --json
```

_See code: [src/commands/auction/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/auction/list.ts)_

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

_See code: [src/commands/broker/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/broker/info.ts)_

## `ethos broker list`

List broker posts (jobs, services, bounties)

```
USAGE
  $ ethos broker list [-j] [-v] [-l <value>] [-o <value>] [-s <value>] [--sort newest|top|hot] [-t
    sell|buy|hire|for-hire|bounty]

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
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

_See code: [src/commands/broker/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/broker/list.ts)_

## `ethos config get`

Show current configuration

```
USAGE
  $ ethos config get [-j]

FLAGS
  -j, --json  Output as JSON

DESCRIPTION
  Show current configuration

EXAMPLES
  $ ethos config get

  $ ethos config get --json
```

_See code: [src/commands/config/get.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/config/get.ts)_

## `ethos config path`

Show config file path

```
USAGE
  $ ethos config path

DESCRIPTION
  Show config file path

EXAMPLES
  $ ethos config path
```

_See code: [src/commands/config/path.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/config/path.ts)_

## `ethos config set VALUE`

Set configuration value

```
USAGE
  $ ethos config set VALUE

ARGUMENTS
  VALUE  Configuration in format: apiUrl=<url>

DESCRIPTION
  Set configuration value

EXAMPLES
  $ ethos config set apiUrl=https://api.ethos.network

  $ ethos config set apiUrl=https://api.dev.ethos.network
```

_See code: [src/commands/config/set.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/config/set.ts)_

## `ethos find QUERY`

Search for users by name, username, or address

```
USAGE
  $ ethos find QUERY [-j] [-v] [-l <value>]

ARGUMENTS
  QUERY  Search query

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Maximum number of results
  -v, --verbose        Show detailed error information

DESCRIPTION
  Search for users by name, username, or address

ALIASES
  $ ethos find

EXAMPLES
  $ ethos find vitalik

  $ ethos find "crypto developer"

  $ ethos find vitalik --json

  $ ethos find web3 --limit 5
```

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

_See code: [src/commands/listing/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/listing/info.ts)_

## `ethos listing list`

List projects on Ethos Listings

```
USAGE
  $ ethos listing list [-j] [-v] [-l <value>] [-o <value>] [--status active|pending|archived]

FLAGS
  -j, --json             Output as JSON
  -l, --limit=<value>    [default: 10] Max results per request
  -o, --offset=<value>   Number of results to skip
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

_See code: [src/commands/listing/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/listing/list.ts)_

## `ethos listing voters PROJECTID`

Show voters for a listing/project

```
USAGE
  $ ethos listing voters PROJECTID [-j] [-v] [-l <value>] [-o <value>] [--sentiment bullish|bearish]

ARGUMENTS
  PROJECTID  Project ID

FLAGS
  -j, --json                Output as JSON
  -l, --limit=<value>       [default: 10] Max results per request
  -o, --offset=<value>      Number of results to skip
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

_See code: [src/commands/listing/voters.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/listing/voters.ts)_

## `ethos market featured`

Show top gainers and losers

```
USAGE
  $ ethos market featured [-j] [-v]

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Show top gainers and losers

EXAMPLES
  $ ethos market featured

  $ ethos market featured --json
```

_See code: [src/commands/market/featured.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/market/featured.ts)_

## `ethos market holders IDENTIFIER`

Show who holds trust/distrust in a user

```
USAGE
  $ ethos market holders IDENTIFIER [-j] [-v] [-l <value>]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Max results
  -v, --verbose        Show detailed error information

DESCRIPTION
  Show who holds trust/distrust in a user

EXAMPLES
  $ ethos market holders sethgho

  $ ethos market holders 0xNowater --limit 20

  $ ethos market holders vitalik.eth --json
```

_See code: [src/commands/market/holders.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/market/holders.ts)_

## `ethos market info IDENTIFIER`

Get trust market info for a user

```
USAGE
  $ ethos market info IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Profile ID or Twitter username

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get trust market info for a user

ALIASES
  $ ethos mi

EXAMPLES
  $ ethos market info 123

  $ ethos market info vitalik

  $ ethos market info vitalik --json
```

_See code: [src/commands/market/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/market/info.ts)_

## `ethos market list`

List trust markets

```
USAGE
  $ ethos market list [-j] [-v] [-l <value>] [-o <value>] [--order asc|desc] [-s <value>] [--sort
    marketCapWei|volume24hWei|priceChange24hPercent|score|createdAt]

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -s, --search=<value>  Search by name/username
  -v, --verbose         Show detailed error information
      --order=<option>  [default: desc] Sort direction
                        <options: asc|desc>
      --sort=<option>   [default: marketCapWei] Sort by field
                        <options: marketCapWei|volume24hWei|priceChange24hPercent|score|createdAt>

DESCRIPTION
  List trust markets

ALIASES
  $ ethos ml

EXAMPLES
  $ ethos market list

  $ ethos market list --sort priceChange24hPercent --order desc

  $ ethos market list --search "vitalik" --json
```

_See code: [src/commands/market/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/market/list.ts)_

## `ethos mi IDENTIFIER`

Get trust market info for a user

```
USAGE
  $ ethos mi IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Profile ID or Twitter username

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get trust market info for a user

ALIASES
  $ ethos mi

EXAMPLES
  $ ethos mi 123

  $ ethos mi vitalik

  $ ethos mi vitalik --json
```

## `ethos ml`

List trust markets

```
USAGE
  $ ethos ml [-j] [-v] [-l <value>] [-o <value>] [--order asc|desc] [-s <value>] [--sort
    marketCapWei|volume24hWei|priceChange24hPercent|score|createdAt]

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -s, --search=<value>  Search by name/username
  -v, --verbose         Show detailed error information
      --order=<option>  [default: desc] Sort direction
                        <options: asc|desc>
      --sort=<option>   [default: marketCapWei] Sort by field
                        <options: marketCapWei|volume24hWei|priceChange24hPercent|score|createdAt>

DESCRIPTION
  List trust markets

ALIASES
  $ ethos ml

EXAMPLES
  $ ethos ml

  $ ethos ml --sort priceChange24hPercent --order desc

  $ ethos ml --search "vitalik" --json
```

## `ethos nft list IDENTIFIER`

List NFTs owned by a user

```
USAGE
  $ ethos nft list IDENTIFIER [-j] [-v] [-l <value>] [-o <value>]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information

DESCRIPTION
  List NFTs owned by a user

EXAMPLES
  $ ethos nft list sethgho

  $ ethos nft list 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos nft list vitalik.eth --json
```

_See code: [src/commands/nft/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/nft/list.ts)_

## `ethos rank IDENTIFIER`

Show leaderboard rank for a user

```
USAGE
  $ ethos rank IDENTIFIER [-j] [-v] [-s <value>]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json            Output as JSON
  -s, --season=<value>  Show XP for specific season
  -v, --verbose         Show detailed error information

DESCRIPTION
  Show leaderboard rank for a user

ALIASES
  $ ethos rank

EXAMPLES
  $ ethos rank 0xNowater

  $ ethos rank 0xNowater --season 2

  $ ethos rank 0xNowater --json
```

## `ethos review info ID`

Get details of a specific review

```
USAGE
  $ ethos review info ID [-j] [-v]

ARGUMENTS
  ID  Review ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific review

ALIASES
  $ ethos ri

EXAMPLES
  $ ethos review info 1139

  $ ethos review info 1139 --json
```

_See code: [src/commands/review/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/review/info.ts)_

## `ethos review list IDENTIFIER`

List reviews for a user

```
USAGE
  $ ethos review list IDENTIFIER [-j] [-v] [-l <value>] [-o <value>]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information

DESCRIPTION
  List reviews for a user

ALIASES
  $ ethos rl

EXAMPLES
  $ ethos review list sethgho

  $ ethos review list 0xNowater --limit 20

  $ ethos review list vitalik.eth --json
```

_See code: [src/commands/review/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/review/list.ts)_

## `ethos review votes ID`

Show votes on a review

```
USAGE
  $ ethos review votes ID [-j] [-v] [--downvotes | --upvotes] [-l <value>] [-o <value>] [-s]

ARGUMENTS
  ID  Review ID

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -s, --stats           Show vote statistics only
  -v, --verbose         Show detailed error information
      --downvotes       Show only downvotes
      --upvotes         Show only upvotes

DESCRIPTION
  Show votes on a review

EXAMPLES
  $ ethos review votes 123

  $ ethos review votes 123 --stats

  $ ethos review votes 123 --upvotes

  $ ethos review votes 123 --json
```

_See code: [src/commands/review/votes.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/review/votes.ts)_

## `ethos ri ID`

Get details of a specific review

```
USAGE
  $ ethos ri ID [-j] [-v]

ARGUMENTS
  ID  Review ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific review

ALIASES
  $ ethos ri

EXAMPLES
  $ ethos ri 1139

  $ ethos ri 1139 --json
```

## `ethos rl IDENTIFIER`

List reviews for a user

```
USAGE
  $ ethos rl IDENTIFIER [-j] [-v] [-l <value>] [-o <value>]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information

DESCRIPTION
  List reviews for a user

ALIASES
  $ ethos rl

EXAMPLES
  $ ethos rl sethgho

  $ ethos rl 0xNowater --limit 20

  $ ethos rl vitalik.eth --json
```

## `ethos score status IDENTIFIER`

Check score calculation status for a user

```
USAGE
  $ ethos score status IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Check score calculation status for a user

EXAMPLES
  $ ethos score status 0xNowater

  $ ethos score status vitalik.eth

  $ ethos score status 0xNowater --json
```

_See code: [src/commands/score/status.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/score/status.ts)_

## `ethos skill install`

Install the ethos-cli skill for AI coding agents

```
USAGE
  $ ethos skill install [-y]

FLAGS
  -y, --yes  Skip confirmation prompts

DESCRIPTION
  Install the ethos-cli skill for AI coding agents

EXAMPLES
  $ ethos skill install

  $ ethos skill install --yes
```

_See code: [src/commands/skill/install.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/skill/install.ts)_

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

_See code: [src/commands/slash/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/slash/info.ts)_

## `ethos slash list`

List reputation slashes

```
USAGE
  $ ethos slash list [-j] [-v] [--author <value>] [-l <value>] [-o <value>] [--status open|closed] [--subject
    <value>]

FLAGS
  -j, --json             Output as JSON
  -l, --limit=<value>    [default: 10] Max results per request
  -o, --offset=<value>   Number of results to skip
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

_See code: [src/commands/slash/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/slash/list.ts)_

## `ethos slash votes ID`

Show votes on a slash

```
USAGE
  $ ethos slash votes ID [-j] [-v] [--downvotes | --upvotes] [-l <value>] [-o <value>] [-s]

ARGUMENTS
  ID  Slash ID

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -s, --stats           Show vote statistics only
  -v, --verbose         Show detailed error information
      --downvotes       Show only downvotes
      --upvotes         Show only upvotes

DESCRIPTION
  Show votes on a slash

EXAMPLES
  $ ethos slash votes 195

  $ ethos slash votes 195 --stats

  $ ethos slash votes 195 --upvotes

  $ ethos slash votes 195 --json
```

_See code: [src/commands/slash/votes.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/slash/votes.ts)_

## `ethos u IDENTIFIER`

Display user profile by username, address, or ENS name

```
USAGE
  $ ethos u IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Display user profile by username, address, or ENS name

ALIASES
  $ ethos u
  $ ethos ui

EXAMPLES
  $ ethos u 0xNowater

  $ ethos u 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos u vitalik.eth

  $ ethos u 0xNowater --json
```

## `ethos ui IDENTIFIER`

Display user profile by username, address, or ENS name

```
USAGE
  $ ethos ui IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Display user profile by username, address, or ENS name

ALIASES
  $ ethos u
  $ ethos ui

EXAMPLES
  $ ethos ui 0xNowater

  $ ethos ui 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos ui vitalik.eth

  $ ethos ui 0xNowater --json
```

## `ethos update`

Update the CLI to the latest version

```
USAGE
  $ ethos update [-f]

FLAGS
  -f, --force  Force update even if already on latest

DESCRIPTION
  Update the CLI to the latest version

EXAMPLES
  $ ethos update

  $ ethos update --force
```

_See code: [src/commands/update.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/update.ts)_

## `ethos us IDENTIFIER`

Display comprehensive user summary with activity and vouches

```
USAGE
  $ ethos us IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Display comprehensive user summary with activity and vouches

ALIASES
  $ ethos us

EXAMPLES
  $ ethos us sethgho

  $ ethos us 0xNowater

  $ ethos us vitalik.eth --json
```

## `ethos user activity IDENTIFIER`

Show recent reviews and vouches for a user

```
USAGE
  $ ethos user activity IDENTIFIER [-j] [-v] [-l <value>] [-t vouch|review]

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

_See code: [src/commands/user/activity.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/user/activity.ts)_

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

ALIASES
  $ ethos u
  $ ethos ui

EXAMPLES
  $ ethos user info 0xNowater

  $ ethos user info 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

  $ ethos user info vitalik.eth

  $ ethos user info 0xNowater --json
```

_See code: [src/commands/user/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/user/info.ts)_

## `ethos user invitations IDENTIFIER`

List invitations sent by a user

```
USAGE
  $ ethos user invitations IDENTIFIER [-j] [-v] [-l <value>] [-o <value>] [-s INVITED|ACCEPTED]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json             Output as JSON
  -l, --limit=<value>    [default: 10] Max results per request
  -o, --offset=<value>   Number of results to skip
  -s, --status=<option>  Filter by status
                         <options: INVITED|ACCEPTED>
  -v, --verbose          Show detailed error information

DESCRIPTION
  List invitations sent by a user

EXAMPLES
  $ ethos user invitations sethgho

  $ ethos user invitations 0xNowater --status ACCEPTED

  $ ethos user invitations vitalik.eth --json
```

_See code: [src/commands/user/invitations.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/user/invitations.ts)_

## `ethos user search QUERY`

Search for users by name, username, or address

```
USAGE
  $ ethos user search QUERY [-j] [-v] [-l <value>]

ARGUMENTS
  QUERY  Search query

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Maximum number of results
  -v, --verbose        Show detailed error information

DESCRIPTION
  Search for users by name, username, or address

ALIASES
  $ ethos find

EXAMPLES
  $ ethos user search vitalik

  $ ethos user search "crypto developer"

  $ ethos user search vitalik --json

  $ ethos user search web3 --limit 5
```

_See code: [src/commands/user/search.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/user/search.ts)_

## `ethos user summary IDENTIFIER`

Display comprehensive user summary with activity and vouches

```
USAGE
  $ ethos user summary IDENTIFIER [-j] [-v]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Display comprehensive user summary with activity and vouches

ALIASES
  $ ethos us

EXAMPLES
  $ ethos user summary sethgho

  $ ethos user summary 0xNowater

  $ ethos user summary vitalik.eth --json
```

_See code: [src/commands/user/summary.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/user/summary.ts)_

## `ethos validator info TOKENID`

Get details of a specific validator NFT

```
USAGE
  $ ethos validator info TOKENID [-j] [-v]

ARGUMENTS
  TOKENID  Validator token ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific validator NFT

EXAMPLES
  $ ethos validator info 1

  $ ethos validator info 42 --json
```

_See code: [src/commands/validator/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/validator/info.ts)_

## `ethos validator list`

List all Ethos validator NFT owners

```
USAGE
  $ ethos validator list [-j] [-v] [-a] [-l <value>] [-o <value>]

FLAGS
  -a, --available       Show only validators with remaining XP capacity
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results to display
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information

DESCRIPTION
  List all Ethos validator NFT owners

EXAMPLES
  $ ethos validator list

  $ ethos validator list --limit 20

  $ ethos validator list --available

  $ ethos validator list --json
```

_See code: [src/commands/validator/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/validator/list.ts)_

## `ethos validator sales`

List validator NFTs for sale on OpenSea

```
USAGE
  $ ethos validator sales [-j] [-v] [-l <value>] [-o <value>]

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information

DESCRIPTION
  List validator NFTs for sale on OpenSea

EXAMPLES
  $ ethos validator sales

  $ ethos validator sales --limit 20 --json
```

_See code: [src/commands/validator/sales.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/validator/sales.ts)_

## `ethos vi ID`

Get details of a specific vouch

```
USAGE
  $ ethos vi ID [-j] [-v]

ARGUMENTS
  ID  Vouch ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific vouch

ALIASES
  $ ethos vi

EXAMPLES
  $ ethos vi 123

  $ ethos vi 123 --json
```

## `ethos vl [IDENTIFIER]`

List vouches for a user or all vouches

```
USAGE
  $ ethos vl [IDENTIFIER] [-j] [-v] [--active] [--author <value>] [-l <value>] [-o <value>]

ARGUMENTS
  [IDENTIFIER]  Twitter username, ETH address, or ENS name (optional, filter by subject)

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information
      --active          Show only active (non-archived) vouches
      --author=<value>  Filter by author (Twitter username, ETH address, or ENS name)

DESCRIPTION
  List vouches for a user or all vouches

ALIASES
  $ ethos vl

EXAMPLES
  $ ethos vl

  $ ethos vl 0xNowater

  $ ethos vl --author 0xNowater

  $ ethos vl --active

  $ ethos vl --limit 20 --json
```

## `ethos vouch info ID`

Get details of a specific vouch

```
USAGE
  $ ethos vouch info ID [-j] [-v]

ARGUMENTS
  ID  Vouch ID

FLAGS
  -j, --json     Output as JSON
  -v, --verbose  Show detailed error information

DESCRIPTION
  Get details of a specific vouch

ALIASES
  $ ethos vi

EXAMPLES
  $ ethos vouch info 123

  $ ethos vouch info 123 --json
```

_See code: [src/commands/vouch/info.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/vouch/info.ts)_

## `ethos vouch list [IDENTIFIER]`

List vouches for a user or all vouches

```
USAGE
  $ ethos vouch list [IDENTIFIER] [-j] [-v] [--active] [--author <value>] [-l <value>] [-o <value>]

ARGUMENTS
  [IDENTIFIER]  Twitter username, ETH address, or ENS name (optional, filter by subject)

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -v, --verbose         Show detailed error information
      --active          Show only active (non-archived) vouches
      --author=<value>  Filter by author (Twitter username, ETH address, or ENS name)

DESCRIPTION
  List vouches for a user or all vouches

ALIASES
  $ ethos vl

EXAMPLES
  $ ethos vouch list

  $ ethos vouch list 0xNowater

  $ ethos vouch list --author 0xNowater

  $ ethos vouch list --active

  $ ethos vouch list --limit 20 --json
```

_See code: [src/commands/vouch/list.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/vouch/list.ts)_

## `ethos vouch mutual TARGET VIEWER`

Find mutual vouchers between two users

```
USAGE
  $ ethos vouch mutual TARGET VIEWER [-j] [-v] [-l <value>]

ARGUMENTS
  TARGET  Target user (Twitter username, ETH address, or ENS name)
  VIEWER  Viewer user (Twitter username, ETH address, or ENS name)

FLAGS
  -j, --json           Output as JSON
  -l, --limit=<value>  [default: 10] Max results
  -v, --verbose        Show detailed error information

DESCRIPTION
  Find mutual vouchers between two users

EXAMPLES
  $ ethos vouch mutual 0xNowater VitalikButerin

  $ ethos vouch mutual 0xNowater VitalikButerin --limit 20

  $ ethos vouch mutual 0xNowater VitalikButerin --json
```

_See code: [src/commands/vouch/mutual.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/vouch/mutual.ts)_

## `ethos vouch votes ID`

Show votes on a vouch

```
USAGE
  $ ethos vouch votes ID [-j] [-v] [--downvotes | --upvotes] [-l <value>] [-o <value>] [-s]

ARGUMENTS
  ID  Vouch ID

FLAGS
  -j, --json            Output as JSON
  -l, --limit=<value>   [default: 10] Max results per request
  -o, --offset=<value>  Number of results to skip
  -s, --stats           Show vote statistics only
  -v, --verbose         Show detailed error information
      --downvotes       Show only downvotes
      --upvotes         Show only upvotes

DESCRIPTION
  Show votes on a vouch

EXAMPLES
  $ ethos vouch votes 182

  $ ethos vouch votes 182 --stats

  $ ethos vouch votes 182 --upvotes

  $ ethos vouch votes 182 --json
```

_See code: [src/commands/vouch/votes.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/vouch/votes.ts)_

## `ethos xp rank IDENTIFIER`

Show leaderboard rank for a user

```
USAGE
  $ ethos xp rank IDENTIFIER [-j] [-v] [-s <value>]

ARGUMENTS
  IDENTIFIER  Twitter username, ETH address, or ENS name

FLAGS
  -j, --json            Output as JSON
  -s, --season=<value>  Show XP for specific season
  -v, --verbose         Show detailed error information

DESCRIPTION
  Show leaderboard rank for a user

ALIASES
  $ ethos rank

EXAMPLES
  $ ethos xp rank 0xNowater

  $ ethos xp rank 0xNowater --season 2

  $ ethos xp rank 0xNowater --json
```

_See code: [src/commands/xp/rank.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/xp/rank.ts)_

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

_See code: [src/commands/xp/seasons.ts](https://github.com/trust-ethos/ethos-cli/blob/v0.0.12/src/commands/xp/seasons.ts)_
<!-- commandsstop -->
