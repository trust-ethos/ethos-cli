// eslint-disable-next-line import/no-unresolved -- eslint-import-resolver-typescript doesn't follow this package's wildcard exports map; tsc and bun resolve it fine.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Flags } from '@oclif/core';

import { BaseCommand } from '../lib/base-command.js';
import { getAccount, getActiveAccount } from '../lib/config/credentials.js';
import { createMcpServer } from '../lib/mcp/server.js';

export default class Mcp extends BaseCommand {
  static description =
    'Run the Ethos CLI as an MCP (Model Context Protocol) stdio server, exposing Ethos actions as tools for an AI agent. Read-only by default.';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --allow-writes',
    '<%= config.bin %> <%= command.id %> --allow-trading --max-spend 25',
  ];
  static flags = {
    account: BaseCommand.baseFlags.account,
    'allow-trading': Flags.boolean({
      default: false,
      description: 'Register trading tools (open/close positions). Implies --allow-writes.',
    }),
    'allow-writes': Flags.boolean({
      default: false,
      description: 'Register write tools (review, vouch).',
    }),
    'max-spend': Flags.integer({
      default: 50,
      description: 'Max credits ethos_open_position may spend in a single call.',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Mcp);

    const allowTrading = flags['allow-trading'];
    const allowWrites = flags['allow-writes'] || allowTrading;
    const maxSpendCredits = flags['max-spend'];
    const account = flags.account ? getAccount(flags.account) : getActiveAccount();

    const toolGroups = [
      'read',
      ...(allowWrites ? ['write'] : []),
      ...(allowTrading ? ['trade'] : []),
    ];

    // MCP JSON-RPC lives on stdout — every log line here must go to stderr.
    console.error(
      `[ethos mcp] account=${account?.name ?? 'none'} tools=${toolGroups.join('+')} maxSpend=${maxSpendCredits}credits`,
    );

    if (!account && allowWrites) {
      console.error(
        '[ethos mcp] warning: no active account; write/trade tools will return an auth error until you run "ethos login".',
      );
    }

    const server = createMcpServer({
      account,
      allowTrading,
      allowWrites,
      client: this.client,
      maxSpendCredits,
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Block forever; the transport keeps the event loop alive via stdin.
    await new Promise<void>(() => {});
  }
}
