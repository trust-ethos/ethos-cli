---
name: ethos-cli-dev
description: |
  Development skill for modifying/extending the Ethos CLI codebase. Use when:
  - Adding new commands to the CLI
  - Modifying API client methods or interfaces
  - Adding new formatters for output
  - Fixing bugs in existing commands
  - Extending error handling or configuration
  Triggers: "add command", "new endpoint", "fix ethos cli", "extend cli", "add formatter", "modify echo-client"
---

# Ethos CLI Development

oclif-based CLI for Ethos Network. TypeScript, ESM-only, Bun runtime.

## Quick Reference

```
src/
├── commands/           # 37 commands across 14 topics
│   └── <topic>/<cmd>.ts
├── lib/
│   ├── api/echo-client.ts    # API client (~970 lines, all types)
│   ├── formatting/output.ts  # 40+ formatters (~930 lines)
│   ├── formatting/error.ts   # Error formatting
│   ├── errors/cli-error.ts   # Error classes
│   ├── validation/userkey.ts # Identifier parsing
│   ├── config/index.ts       # ~/.config/ethos/config.json
│   └── update/index.ts       # Auto-update system
└── hooks/init.ts             # Update check hook
```

## Adding a New Command

### 1. Create Command File

`src/commands/<topic>/<command>.ts`:

```typescript
import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatEntity, output } from '../../lib/formatting/output.js';

export default class TopicCommand extends Command {
  static aliases = ['tc'];  // Optional short alias

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Description for help text';

  static examples = [
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON', default: false }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information', default: false }),
    limit: Flags.integer({ char: 'l', description: 'Max results', default: 10 }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TopicCommand);
    const client = new EchoClient();

    try {
      const data = await client.getEntity(args.identifier);

      if (flags.json) {
        this.log(output(data));
      } else {
        this.log(formatEntity(data));
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

### 2. Add API Method (if needed)

In `src/lib/api/echo-client.ts`:

```typescript
// Add interface near top with other interfaces
export interface NewEntity {
  id: number;
  name: string;
  // ... fields matching API response
}

// Add method in EchoClient class
async getNewEntity(identifier: string): Promise<NewEntity> {
  const user = await this.resolveUser(identifier);
  const userkey = this.getPrimaryUserkey(user);
  return this.request<NewEntity>(`/api/v2/entities/${userkey}`, 'Entity');
}

// For list endpoints with pagination:
async getEntities(params: { limit?: number; offset?: number }): Promise<EntitiesResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  return this.request<EntitiesResponse>(`/api/v2/entities?${query}`, 'Entities');
}
```

### 3. Add Formatter (if needed)

In `src/lib/formatting/output.ts`:

```typescript
import pc from 'picocolors';

// Single entity
export function formatEntity(entity: Entity): string {
  const lines = [
    pc.bold(pc.cyan(`Entity: ${entity.name}`)),
    '',
    `${pc.dim('ID:')} ${entity.id}`,
    `${pc.dim('Status:')} ${entity.active ? pc.green('Active') : pc.red('Inactive')}`,
  ];
  return lines.filter(Boolean).join('\n');
}

// List of entities
export function formatEntities(entities: Entity[], total: number): string {
  if (!entities.length) {
    return pc.yellow('No entities found.');
  }
  const lines = [pc.bold(`Entities (${total} total)`), ''];
  for (const e of entities) {
    lines.push(`  ${pc.cyan(e.name)} - ${e.status}`);
  }
  return lines.join('\n');
}
```

### 4. Regenerate README

```bash
bun run readme
```

## Key Patterns

### Identifier Resolution

Commands accept flexible identifiers. Use `client.resolveUser()`:
- `0xNowater` → Twitter username
- `vitalik.eth` → ENS name
- `0xd8dA6BF...` → ETH address (42 chars)
- `profileId:123` → Explicit profile ID

### Output Pattern

Always support both modes:
```typescript
if (flags.json) {
  this.log(output(data));      // JSON.stringify with 2-space indent
} else {
  this.log(formatXxx(data));   // Human-readable with colors
}
```

### Error Handling

Always use try-catch with formatError:
```typescript
try {
  // API call
} catch (error) {
  if (error instanceof Error) {
    this.log(formatError(error, flags.verbose));
    this.exit(1);
  }
}
```

Exit codes: `0` success, `1` runtime error, `2` validation error.

### Common Flags

```typescript
// Universal (include in every command)
json: Flags.boolean({ char: 'j', description: 'Output as JSON', default: false })
verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information', default: false })

// Pagination (for list commands)
limit: Flags.integer({ char: 'l', description: 'Max results', default: 10 })
offset: Flags.integer({ char: 'o', description: 'Skip results', default: 0 })

// Enum filter
status: Flags.string({ options: ['active', 'pending', 'closed'] })

// Exclusive flags
upvotes: Flags.boolean({ exclusive: ['downvotes'] })
downvotes: Flags.boolean({ exclusive: ['upvotes'] })
```

## Error Classes

```typescript
import { NetworkError, NotFoundError, APIError, ValidationError } from '../errors/cli-error.js';

// In API client
throw new NotFoundError('User', identifier);        // 404
throw new NetworkError(message, url, statusCode);   // Connection failures
throw new APIError(message, statusCode, response);  // Other API errors
throw new ValidationError(message, field);          // Input validation
```

## Score Levels

```typescript
// < 800: untrusted (red)
// 800-1199: questionable (yellow)
// 1200-1599: neutral (white)
// 1600-1999: reputable (green)
// 2000+: exemplary (cyan)
```

## Development Commands

```bash
bun run dev <topic> <cmd>    # Run without build
bun run build                # Compile TypeScript
bun test                     # Run tests
bun run readme               # Regenerate README
bun run typecheck            # Type check only
```

## File Conventions

- Use `.js` extension for local imports (ESM requirement)
- Sort imports: external first, then local
- Export default class (one command per file)
- Naming: `formatUser()` single, `formatUsers()` list
- Colors: use `picocolors` (`pc.bold()`, `pc.dim()`, `pc.green()`, etc.)
