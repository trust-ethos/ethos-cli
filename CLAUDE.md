# Ethos CLI - Development Guide

## Overview

CLI for querying Ethos user profiles, XP balances, reputation data, trust markets, vouches, and more.

**Stack:**
- **Runtime**: Bun (TypeScript, fast startup)
- **Framework**: oclif (plugin architecture, auto-docs)
- **Testing**: bun test
- **Distribution**: npm (`@ethos/cli`)

## Quick Start

```bash
bun install
bun run dev user info vitalik.eth   # Development
bun run build                        # Build
bun test                             # Test
```

## Project Structure

```
ethos-cli/
├── src/
│   ├── commands/           # 37 commands across 13 topics
│   │   ├── auction/        # active, info, list
│   │   ├── broker/         # info, list
│   │   ├── config/         # get, path, set
│   │   ├── listing/        # info, list, voters
│   │   ├── market/         # featured, holders, info, list
│   │   ├── nft/            # list
│   │   ├── review/         # info, list, votes
│   │   ├── score/          # status
│   │   ├── slash/          # info, list, votes
│   │   ├── user/           # activity, info, invitations, search, summary
│   │   ├── validator/      # info, list, sales
│   │   ├── vouch/          # info, list, mutual, votes
│   │   └── xp/             # rank, seasons
│   ├── lib/
│   │   ├── api/
│   │   │   └── echo-client.ts   # API wrapper (~970 lines, all types + methods)
│   │   ├── config/
│   │   │   └── index.ts         # ~/.config/ethos/config.json
│   │   ├── errors/
│   │   │   └── cli-error.ts     # CLIError, NetworkError, NotFoundError, APIError
│   │   ├── formatting/
│   │   │   ├── colors.ts        # Color utilities
│   │   │   ├── error.ts         # Error formatting
│   │   │   └── output.ts        # All formatters (~930 lines)
│   │   ├── validation/
│   │   │   └── userkey.ts       # Identifier parsing
│   │   └── help.ts              # Custom help class
│   └── index.ts
├── test/
│   ├── commands/           # Command tests (oclif runCommand)
│   ├── lib/                # Library tests
│   └── helpers/            # Mock utilities
├── bin/
│   ├── dev.js              # Development entry
│   └── run.js              # Production entry
└── dist/                   # Compiled output
```

## Architecture

### Command Pattern

All commands follow this structure:

```typescript
import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatUser, output } from '../../lib/formatting/output.js';

export default class UserInfo extends Command {
  static aliases = ['u', 'ui'];  // Short aliases

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Display user profile by username, address, or ENS name';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserInfo);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);

      if (flags.json) {
        this.log(output(user));
      } else {
        this.log(formatUser(user));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
```

**Key patterns:**
1. `static aliases` - Short command aliases
2. `static flags` - Always include `--json` and `--verbose`
3. `EchoClient` for all API calls
4. `formatError()` for error output
5. Dedicated formatter function per entity type
6. `output()` for JSON serialization

### API Client (`echo-client.ts`)

Single file containing:
- All TypeScript interfaces for API responses
- `EchoClient` class with methods for each endpoint
- Built-in timeout (10s), debug logging, error handling

```typescript
const client = new EchoClient();

// User resolution (auto-detects identifier type)
const user = await client.resolveUser('vitalik.eth');

// Direct lookups
const user = await client.getUserByTwitter('0xNowater');
const user = await client.getUserByAddress('0x...');
const user = await client.getUserByProfileId('123');

// Lists with pagination
const markets = await client.getMarkets({ limit: 10, offset: 0, orderBy: 'marketCapWei' });
const vouches = await client.getVouches({ subjectUserkeys: ['service:x.com:user'] });
```

### Error Handling

Custom error classes in `lib/errors/cli-error.ts`:

```typescript
CLIError          // Base class with code + suggestions
├── NetworkError  // Connection failures, timeouts
├── NotFoundError // 404 responses
├── APIError      // Other API errors
└── ValidationError
```

Commands catch errors and use `formatError()`:
```typescript
catch (error) {
  if (error instanceof Error) {
    this.log(formatError(error, flags.verbose));
    this.exit(1);
  }
}
```

### Identifier Parsing (`lib/validation/userkey.ts`)

Auto-detects identifier type:
- `0x...` (40 hex chars) → address
- `*.eth` → ENS
- Pure digits → profileId
- Everything else → Twitter username

Explicit prefixes supported: `twitter:`, `address:`, `profileId:`, `service:x.com:`

### Output Formatting

Two modes: JSON (`output()`) and human-readable (dedicated formatters).

```typescript
// JSON - always use output()
this.log(output(data));

// Human-readable - use specific formatter
this.log(formatUser(user));
this.log(formatMarkets(markets, total));
this.log(formatVouches(vouches, total));
```

Use `picocolors` for terminal colors:
```typescript
import pc from 'picocolors';
pc.bold(), pc.dim(), pc.green(), pc.red(), pc.yellow(), pc.cyan()
```

## Development Workflow

### Adding a New Command

1. Create file: `src/commands/<topic>/<command>.ts`
2. Follow command pattern above
3. Add formatter to `lib/formatting/output.ts` if needed
4. Add API method to `lib/api/echo-client.ts` if needed
5. Test: `bun run dev <topic> <command> --help`
6. Add test: `test/commands/<topic>/<command>.test.ts`
7. Regenerate README: `bun run readme`

### Testing

```bash
bun test                    # Run all tests
bun test --watch            # Watch mode
bun test test/commands/     # Run specific directory
```

Tests use `@oclif/test`:
```typescript
import { describe, test, expect } from 'bun:test';
import { runCommand } from '@oclif/test';

describe('user info', () => {
  test('runs with valid identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'vitalik.eth']);
    expect(error).toBeUndefined();
  });
});
```

### Code Style

- Use `.js` extension for local imports (ESM requirement)
- Sort imports: external first, then local
- Explicit return types for public functions
- `const` over `let`
- Exit code 1 for runtime errors, 2 for invalid usage

## Configuration

Config stored at `~/.config/ethos/config.json`:

```bash
ethos config get              # Show current config
ethos config set apiUrl=...   # Set API URL
ethos config path             # Show config file path
```

Environment override: `ETHOS_API_URL=http://localhost:4000 ethos user info ...`

## Build & Release

```bash
bun run build       # TypeScript → JavaScript
bun run prepack     # Generate manifest + README
npm publish         # Publish to npm
```

## Dependencies

**Runtime:**
- `@oclif/core` - CLI framework
- `@oclif/plugin-autocomplete` - Shell completions
- `@oclif/plugin-help` - Help system
- `picocolors` - Terminal colors
- `zod` - Schema validation

**Development:**
- `@types/bun`, `typescript`, `oclif`

## Links

- [oclif Documentation](https://oclif.io)
- [Bun Documentation](https://bun.sh/docs)
- [GitHub Repository](https://github.com/ethos-network/ethos-cli)
