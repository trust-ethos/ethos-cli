# Ethos CLI - Development Guide

## Overview

The Ethos CLI is a standalone command-line tool for querying Ethos user profiles, XP balances, and reputation data. Built with:

- **Runtime**: Bun (native TypeScript, fast startup)
- **Framework**: oclif (plugin architecture, auto-docs)
- **Testing**: bun test (built-in, fast)
- **Distribution**: npm, Homebrew (planned), curl install (planned)

## Quick Start

```bash
# Clone and install
git clone https://github.com/ethos-network/ethos-cli.git
cd ethos-cli
bun install

# Development
bun run dev user info vitalik.eth

# Build
bun run build

# Test
bun test
```

## Project Structure

```
ethos-cli/
├── src/
│   ├── commands/          # Command implementations
│   │   ├── user/          # User-related commands
│   │   │   ├── info.ts    # Template for all commands
│   │   │   └── search.ts
│   │   └── xp/            # XP-related commands
│   │       ├── balance.ts
│   │       ├── rank.ts
│   │       └── seasons.ts
│   ├── lib/
│   │   ├── api/
│   │   │   └── echo-client.ts  # Lightweight API wrapper
│   │   ├── formatting/
│   │   │   └── output.ts       # Human + JSON output
│   │   └── validation/
│   │       └── userkey.ts      # Userkey parsing
│   └── index.ts
├── test/
│   ├── commands/          # Command tests
│   └── lib/               # Library tests
├── bin/
│   ├── dev.js             # Development entry (Bun)
│   └── run.js             # Production entry
├── dist/                  # Compiled output
└── package.json
```

## Architecture

### Command Structure

All commands follow the same pattern (see `src/commands/user/info.ts`):

```typescript
import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatUser, output } from '../../lib/formatting/output.js';

export default class UserInfo extends Command {
  static args = {
    identifier: Args.string({
      description: 'Username or Ethereum address',
      required: true,
    }),
  };

  static description = 'Display user profile by username or address';

  static examples = [
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];

  static flags = {
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserInfo);
    const client = new EchoClient();

    try {
      const user = await client.getUserByUsername(args.identifier);

      if (flags.json) {
        this.log(output(user, flags));
      } else {
        this.log(formatUser(user));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.error(error.message, { exit: 1 });
      }
      throw error;
    }
  }
}
```

**Key Patterns:**
1. Extend `Command` from `@oclif/core`
2. Define `args`, `flags`, `description`, and `examples` as static properties
3. Implement `async run()` method
4. Support both JSON and human-readable output
5. Use semantic exit codes (0 = success, 1 = error, 2 = invalid usage)

### API Client

`EchoClient` is a lightweight wrapper around native `fetch`:

```typescript
export class EchoClient {
  private baseUrl: string;

  constructor(env?: Environment) {
    const environment = env || (process.env.ETHOS_ENV as Environment) || 'prod';
    this.baseUrl = process.env.ETHOS_API_URL || API_URLS[environment];
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API request failed (${response.status})`);
    }

    return await response.json() as T;
  }

  async getUserByUsername(username: string) {
    return this.request(`/api/v1/user/username/${encodeURIComponent(username)}`);
  }
}
```

**Design Principles:**
- No dependencies beyond native fetch
- Simple error handling with descriptive messages
- Environment-aware (prod/staging/dev)
- Type-safe responses (TypeScript)

### Output Formatting

Two output modes: JSON and human-readable.

**JSON Output:**
```typescript
export function output<T>(data: T, flags: { json?: boolean }): string {
  if (flags.json) {
    return JSON.stringify(data, null, 2);
  }
  // ... human-readable formatting
}
```

**Human-Readable Output:**
```typescript
import pc from 'picocolors';

export function formatUser(user: any): string {
  return [
    pc.bold(pc.cyan(`User Profile: ${user.username}`)),
    '',
    `${pc.dim('ID:')} ${user.id}`,
    `${pc.dim('Score:')} ${pc.green(String(user.score))}`,
  ].join('\n');
}
```

**Guidelines:**
- Use `picocolors` for terminal colors (lightweight, fast)
- Keep formatters simple and focused
- Test both JSON and human output
- Ensure JSON output is parseable by `jq`

## Development Workflow

### Adding a New Command

1. Create command file in appropriate directory:
   ```bash
   touch src/commands/user/new-command.ts
   ```

2. Copy template from `src/commands/user/info.ts`

3. Update command class, args, flags, and logic

4. Add formatter to `src/lib/formatting/output.ts` (if needed)

5. Build and test:
   ```bash
   bun run build
   bun run dev user new-command --help
   bun run dev user new-command test-arg
   ```

6. Add tests:
   ```bash
   touch test/commands/user/new-command.test.ts
   bun test
   ```

7. Update README:
   ```bash
   bun run readme
   ```

### Testing Strategy

**Unit Tests** (`bun test`):
- Test library functions (validation, formatting)
- Mock API responses
- Fast feedback loop

**Integration Tests** (manual):
- Test actual API calls
- Verify output formatting
- Test error handling

**Example Unit Test:**
```typescript
import { describe, expect, test } from 'bun:test';
import { parseUserkey } from '../../../src/lib/validation/userkey.js';

describe('parseUserkey', () => {
  test('parses Ethereum address', () => {
    const result = parseUserkey('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });
});
```

### Code Style

**TypeScript:**
- Use explicit return types for public functions
- Prefer `const` over `let`
- Use template literals for strings
- Enable strict mode

**Naming:**
- Commands: kebab-case (`user-info.ts` → `user info`)
- Functions: camelCase (`getUserByUsername`)
- Classes: PascalCase (`EchoClient`)
- Constants: UPPER_SNAKE_CASE (`API_URLS`)

**Imports:**
- Use `.js` extension for local imports (ESM requirement)
- Sort imports: external first, then local
- One import per line

**Error Handling:**
- Use `try/catch` in command `run()` methods
- Exit code 1 for runtime errors
- Exit code 2 for invalid usage (oclif handles this)
- Include helpful error messages

## Environment Variables

**Development:**
```bash
# Use local API
export ETHOS_ENV=dev
export ETHOS_API_URL=http://localhost:4000

# Use staging API
export ETHOS_ENV=staging

# Enable verbose logging (future)
export DEBUG=ethos:*
```

**Production:**
```bash
# Default (production API)
ethos user info vitalik.eth

# Custom endpoint
ETHOS_API_URL=https://custom-api.example.com ethos user info vitalik.eth
```

## Build & Release

### Local Development Build

```bash
# TypeScript → JavaScript
bun run build

# Run built version
./bin/run.js user info vitalik.eth
```

### npm Package Build

```bash
# Prepare for publishing
bun run prepack

# This runs:
# 1. oclif manifest (generates oclif.manifest.json)
# 2. oclif readme (updates README.md)

# Publish to npm
npm publish --access public
```

### Binary Build (Future)

```bash
# Build standalone binary with Bun
bun build ./bin/run.js \
  --compile \
  --minify \
  --sourcemap \
  --outfile dist/ethos

# Result: Single executable, no Node.js or Bun required
./dist/ethos user info vitalik.eth
```

## Troubleshooting

### TypeScript Errors

**Problem:** `error TS2694: Namespace has no exported member`

**Solution:** Add `"skipLibCheck": true` to `tsconfig.json`

### Import Errors

**Problem:** `Cannot find module './lib/api/echo-client'`

**Solution:** Add `.js` extension: `import { EchoClient } from './lib/api/echo-client.js'`

### Command Not Found

**Problem:** `ethos: command not found` after `bun run build`

**Solution:** Use `./bin/dev.js` for development or install globally:
```bash
npm link
# or
bun link
```

## Performance

**Target Metrics:**
- Cold start: < 300ms (Bun) / < 500ms (Node.js)
- Warm start: < 100ms
- Package size: < 5MB (npm tarball)
- Test suite: < 1s

**Profiling:**
```bash
# Measure startup time
time ethos user info vitalik.eth

# Check package size
npm pack
ls -lh ethos-cli-*.tgz
```

## Dependencies

**Runtime:**
- `@oclif/core` - CLI framework
- `picocolors` - Terminal colors
- `zod` - Schema validation (optional)

**Development:**
- `@types/bun` - Bun type definitions
- `typescript` - Type checking
- `oclif` - CLI development tools

**Philosophy:**
- Minimize dependencies for faster installs
- Use native APIs where possible (fetch, JSON)
- Prefer Bun built-ins over external packages

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-command`
3. Make changes and test: `bun test`
4. Build: `bun run build`
5. Update README: `bun run readme`
6. Commit: `git commit -m "Add new command"`
7. Push: `git push origin feature/new-command`
8. Open Pull Request

**PR Checklist:**
- [ ] Tests pass (`bun test`)
- [ ] TypeScript compiles (`bun run typecheck`)
- [ ] README updated (`bun run readme`)
- [ ] Examples added to command
- [ ] SKILL.md updated (for new commands)
- [ ] No new dependencies (unless justified)

## Future Enhancements

**Phase 2 - Distribution:**
- [ ] Homebrew formula
- [ ] Curl install script
- [ ] Binary builds (macOS, Linux)
- [ ] GitHub Actions CI/CD

**Phase 3 - Features:**
- [ ] Review commands (read-only)
- [ ] Vouch commands (read-only)
- [ ] Interactive prompts (`@clack/prompts`)
- [ ] Shell completions (bash, zsh, fish)
- [ ] Configuration file (`~/.config/ethos/config.json`)
- [ ] Verbose mode (`--verbose`)

**Phase 4 - Advanced:**
- [ ] Blockchain read queries (via viem)
- [ ] Caching layer (local SQLite)
- [ ] Batch operations
- [ ] GraphQL support

## Links

- [oclif Documentation](https://oclif.io)
- [Bun Documentation](https://bun.sh/docs)
- [Ethos API Documentation](https://docs.ethos.network/api)
- [GitHub Repository](https://github.com/ethos-network/ethos-cli)
