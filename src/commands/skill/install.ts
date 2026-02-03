import { Command, Flags } from '@oclif/core';
import { checkbox, confirm, select } from '@inquirer/prompts';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import pc from 'picocolors';

const AGENTS = [
  { name: 'Claude Code', projectDir: '.claude/skills', globalDir: '.claude/skills', projectDetect: '.claude', globalDetect: '.claude' },
  { name: 'OpenCode', projectDir: '.opencode/skills', globalDir: '.config/opencode/skills', projectDetect: '.opencode', globalDetect: '.config/opencode' },
  { name: 'OpenClaw', projectDir: 'skills', globalDir: '.agents/skills', projectDetect: '.agents', globalDetect: '.agents' },
  { name: 'Antigravity', projectDir: '.agent/skills', globalDir: '.agent/skills', projectDetect: '.agent', globalDetect: '.agent' },
  { name: 'Augment', projectDir: '.augment/rules', globalDir: '.augment/rules', projectDetect: '.augment', globalDetect: '.augment' },
  { name: 'Cline', projectDir: '.cline/skills', globalDir: '.cline/skills', projectDetect: '.cline', globalDetect: '.cline' },
  { name: 'CodeBuddy', projectDir: '.codebuddy/skills', globalDir: '.codebuddy/skills', projectDetect: '.codebuddy', globalDetect: '.codebuddy' },
  { name: 'Codex', projectDir: '.codex/skills', globalDir: '.codex/skills', projectDetect: '.codex', globalDetect: '.codex' },
  { name: 'Amp', projectDir: '.agents/skills', globalDir: '.agents/skills', projectDetect: '.agents', globalDetect: '.agents' },
] as const;

type Agent = (typeof AGENTS)[number];
type Scope = 'project' | 'global';

interface InstallTarget {
  agent: Agent;
  scope: Scope;
  path: string;
  exists: boolean;
}

const SKILL_CONTENT = `---
name: ethos-cli
description: |
  Query Ethos Network reputation data via CLI. Use when users ask about:
  - Looking up user profiles, scores, or reputation (ethos user info/summary)
  - Checking vouches, reviews, or slashes between users
  - Querying XP balances, leaderboard ranks, or seasons
  - Exploring trust markets, listings, or broker posts
  - Finding validator NFTs or auctions
  Triggers: "ethos reputation", "check score", "who vouched for", "trust market", "ethos profile", "review on ethos"
allowed-tools: Bash(ethos:*)
---

# Ethos CLI

Read-only CLI for querying Ethos Network reputation data.

## Installation

\`\`\`bash
npm install -g @trust-ethos/cli
\`\`\`

## User Identification

All commands accept flexible identifiers:

| Format | Example |
|--------|---------|
| Twitter username | \`sethgho\`, \`0xNowater\` |
| ETH address | \`0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\` |
| ENS name | \`vitalik.eth\` |

## Commands

### User
\`\`\`bash
ethos user info <user>           # Profile with score level
ethos user summary <user>        # Profile + activity + vouches
ethos user activity <user>       # Recent reviews/vouches
ethos user search <query>        # Find users
ethos user invitations <user>    # Invitations sent
\`\`\`

### Vouches
\`\`\`bash
ethos vouch list <user>          # Vouches received
ethos vouch list --author <user> # Vouches given
ethos vouch info <id>            # Vouch details
ethos vouch mutual <u1> <u2>     # Mutual vouchers
ethos vouch votes <id>           # Votes on vouch
\`\`\`

### Reviews
\`\`\`bash
ethos review list <user>         # Reviews for user
ethos review info <id>           # Review details
ethos review votes <id>          # Votes on review
\`\`\`

### Slashes
\`\`\`bash
ethos slash list                 # All slashes
ethos slash info <id>            # Slash details
ethos slash votes <id>           # Votes on slash
\`\`\`

### XP
\`\`\`bash
ethos xp rank <user>             # Leaderboard position
ethos xp rank <user> --season 2  # Specific season
ethos xp seasons                 # List seasons
\`\`\`

### Trust Markets
\`\`\`bash
ethos market list                # All markets
ethos market info <user>         # User's market
ethos market holders <user>      # Trust/distrust holders
ethos market featured            # Top gainers/losers
\`\`\`

### Projects/Listings
\`\`\`bash
ethos listing list               # Active listings
ethos listing info <id>          # Project details
ethos listing voters <id>        # Bullish/bearish voters
\`\`\`

### Broker Posts
\`\`\`bash
ethos broker list                # All posts
ethos broker list --type hire    # Filter: sell|buy|hire|for-hire|bounty
ethos broker info <id>           # Post details
\`\`\`

### Validators & Auctions
\`\`\`bash
ethos validator list             # All validators
ethos validator info <tokenId>   # Validator details
ethos validator sales            # For sale on OpenSea
ethos auction list               # All auctions
ethos auction active             # Current auction
ethos auction info <id>          # Auction details
\`\`\`

### Configuration
\`\`\`bash
ethos config get                 # Show config
ethos config set apiUrl=<url>    # Set API
ethos config path                # Config location
\`\`\`

## Global Flags

All commands support:
- \`--json\` / \`-j\` — JSON output
- \`--verbose\` / \`-v\` — Detailed errors
- \`--limit\` / \`-l\` — Results limit (default: 10)
- \`--offset\` / \`-o\` — Pagination offset

## Score Levels

| Range | Level |
|-------|-------|
| < 800 | UNTRUSTED |
| 800-1199 | QUESTIONABLE |
| 1200-1599 | NEUTRAL |
| 1600-1999 | REPUTABLE |
| 2000+ | EXEMPLARY |

## Common Patterns

\`\`\`bash
# Quick lookup
ethos user info vitalik.eth

# Full picture
ethos user summary sethgho

# Mutual connections
ethos vouch mutual sethgho 0xNowater

# Script with jq
ethos user info sethgho --json | jq '.score'
ethos vouch list sethgho --json | jq '.values[].balance'
\`\`\`

## Exit Codes

- \`0\` — Success
- \`1\` — Runtime error
- \`2\` — Invalid usage
`;

export default class SkillInstall extends Command {
  static description = 'Install the ethos-cli skill for AI coding agents';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --yes',
  ];

  static flags = {
    yes: Flags.boolean({ char: 'y', description: 'Skip confirmation prompts' }),
  };

  private detectAvailableAgents(): { agent: Agent; hasGlobal: boolean; hasProject: boolean }[] {
    const home = homedir();
    const cwd = process.cwd();
    
    return AGENTS.map(agent => ({
      agent,
      hasGlobal: existsSync(join(home, agent.globalDetect)),
      hasProject: existsSync(join(cwd, agent.projectDetect)),
    })).filter(({ hasGlobal, hasProject }) => hasGlobal || hasProject);
  }

  private getInstallPath(agent: Agent, scope: Scope): string {
    const base = scope === 'global' ? homedir() : process.cwd();
    const dir = scope === 'global' ? agent.globalDir : agent.projectDir;
    return join(base, dir, 'ethos-cli.md');
  }

  private formatPath(path: string): string {
    const home = homedir();
    if (path.startsWith(home)) {
      return path.replace(home, '~');
    }
    return path.replace(process.cwd(), '.');
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(SkillInstall);
    
    this.log(pc.cyan('ethos-cli skill installer'));
    this.log('');

    const availableAgents = this.detectAvailableAgents();
    
    if (availableAgents.length === 0) {
      this.log(pc.yellow('No AI coding agents detected on your system.'));
      this.log('');
      this.log('Supported agents:');
      for (const agent of AGENTS) {
        this.log(`  - ${agent.name} (${agent.projectDetect}/)`);
      }
      this.log('');
      this.log('Install an agent first, then run this command again.');
      return;
    }

    this.log(pc.dim(`Found ${availableAgents.length} agent(s)`));
    this.log('');

    const selectedAgentNames = await checkbox({
      message: 'Which agents do you want to install to?',
      choices: availableAgents.map(({ agent }) => ({
        name: `${agent.name} (${agent.projectDir})`,
        value: agent.name,
        checked: agent.name === 'Claude Code',
      })),
    });

    if (selectedAgentNames.length === 0) {
      this.log(pc.yellow('No agents selected. Aborting.'));
      return;
    }

    const selectedAgents = availableAgents
      .filter(({ agent }) => selectedAgentNames.includes(agent.name))
      .map(({ agent }) => agent);

    this.log('');

    const scope = await select<Scope>({
      message: 'Installation scope',
      choices: [
        { 
          name: 'Project (Install in current directory, committed with your project)', 
          value: 'project' as Scope,
        },
        { 
          name: 'Global (Install in home directory)', 
          value: 'global' as Scope,
        },
      ],
    });

    this.log('');

    const targets: InstallTarget[] = selectedAgents.map(agent => {
      const path = this.getInstallPath(agent, scope);
      return {
        agent,
        scope,
        path,
        exists: existsSync(path),
      };
    });

    this.log(pc.bold('Installation Summary'));
    this.log('');
    
    const overwrites = targets.filter(t => t.exists);
    const newInstalls = targets.filter(t => !t.exists);

    for (const target of targets) {
      const status = target.exists ? pc.yellow('(overwrite)') : pc.green('(new)');
      this.log(`  ${this.formatPath(target.path)}`);
      this.log(`    ${pc.dim('->')} ${target.agent.name} ${status}`);
    }

    this.log('');

    if (overwrites.length > 0) {
      this.log(pc.yellow(`Will overwrite ${overwrites.length} existing file(s)`));
      this.log('');
    }

    if (!flags.yes) {
      const proceed = await confirm({
        message: 'Proceed with installation?',
        default: true,
      });

      if (!proceed) {
        this.log(pc.dim('Installation cancelled.'));
        return;
      }
    }

    this.log('');

    for (const target of targets) {
      try {
        const dir = dirname(target.path);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(target.path, SKILL_CONTENT, 'utf-8');
        this.log(`${pc.green('Installed')} ${this.formatPath(target.path)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log(`${pc.red('Failed')} ${this.formatPath(target.path)}: ${message}`);
      }
    }

    this.log('');
    this.log(pc.green('Done!') + ' The ethos-cli skill is now available to your AI agents.');
  }
}
