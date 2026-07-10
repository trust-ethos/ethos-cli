// eslint-disable-next-line import/no-unresolved -- eslint-import-resolver-typescript doesn't follow this package's wildcard exports map; tsc and bun resolve it fine.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { resolveReviewSubject } from '../../commands/review/add.js';
import { resolveVouchTarget } from '../../commands/vouch/create.js';
import { type EchoClient } from '../api/echo-client.js';
import { type ActiveAccount } from '../config/credentials.js';
import { ValidationError } from '../errors/cli-error.js';
import { creditsToWei } from '../formatting/amount.js';

export interface CreateMcpServerOptions {
  account: ActiveAccount | null;
  allowTrading: boolean;
  allowWrites: boolean;
  client: EchoClient;
  maxSpendCredits: number;
}

const SIDE_SCHEMA = z
  .enum(['long', 'short'])
  .describe('Market side: long (trust) or short (distrust)');
const CREDITS_SCHEMA = z.string().describe('Decimal credits amount, e.g. "10" or "2.5"');

function jsonResult(data: unknown): { content: [{ text: string; type: 'text' }] } {
  return { content: [{ text: JSON.stringify(data, null, 2), type: 'text' }] };
}

export function createMcpServer(options: CreateMcpServerOptions): McpServer {
  const { account, allowTrading, allowWrites, client, maxSpendCredits } = options;
  const writesEnabled = allowWrites || allowTrading;

  const server = new McpServer({ name: 'ethos', version: '1.0.0' });

  registerReadTools(server, client);

  if (writesEnabled) {
    registerWriteTools(server, client);
  }

  if (allowTrading) {
    registerTradeTools(server, client, maxSpendCredits);
  }

  server.registerTool(
    'ethos_whoami',
    { description: 'Show the Ethos account this MCP server is acting as.' },
    async () => {
      if (!account) return jsonResult({ signedIn: false });
      return jsonResult({ account: account.name, signedIn: true, user: account.user });
    },
  );

  return server;
}

function registerReadTools(server: McpServer, client: EchoClient): void {
  server.registerTool(
    'ethos_list_markets',
    {
      description: 'List Ethos reputation markets.',
      inputSchema: {
        limit: z.number().int().positive().max(100).optional().describe('Max markets to return'),
      },
    },
    async ({ limit }) => jsonResult(await client.listMarketsV2({ limit })),
  );

  server.registerTool(
    'ethos_get_market',
    {
      description: 'Get details for a single reputation market by its on-chain ID.',
      inputSchema: { marketOnchainId: z.number().int().describe('On-chain market ID') },
    },
    async ({ marketOnchainId }) => jsonResult(await client.getMarketV2(marketOnchainId)),
  );

  server.registerTool(
    'ethos_quote_open',
    {
      description:
        'Get a price quote for opening a position in a market, without submitting a transaction.',
      inputSchema: {
        amountCredits: CREDITS_SCHEMA.describe('Credits to spend'),
        marketOnchainId: z.number().int().describe('On-chain market ID'),
        side: SIDE_SCHEMA,
      },
    },
    async ({ amountCredits, marketOnchainId, side }) =>
      jsonResult(
        await client.simulateOpen(marketOnchainId, {
          isPositive: side === 'long',
          paymentAmount: creditsToWei(amountCredits),
        }),
      ),
  );

  server.registerTool(
    'ethos_quote_close',
    {
      description:
        'Get a price quote for closing a position in a market, without submitting a transaction.',
      inputSchema: {
        marketOnchainId: z.number().int().describe('On-chain market ID'),
        side: SIDE_SCHEMA,
        tokens: z.string().describe('Position tokens to close, e.g. "5" or "2.5"'),
      },
    },
    async ({ marketOnchainId, side, tokens }) =>
      jsonResult(
        await client.simulateClose(marketOnchainId, {
          isPositive: side === 'long',
          positionTokenAmount: creditsToWei(tokens),
        }),
      ),
  );

  server.registerTool(
    'ethos_get_position',
    {
      description: "Get this account's open position (if any) in a market.",
      inputSchema: {
        marketOnchainId: z.number().int().describe('On-chain market ID'),
        side: SIDE_SCHEMA,
      },
    },
    async ({ marketOnchainId, side }) =>
      jsonResult(await client.marketV2Position(marketOnchainId, side === 'long')),
  );
}

function registerWriteTools(server: McpServer, client: EchoClient): void {
  server.registerTool(
    'ethos_add_review',
    {
      description:
        'Post a review of a user, identified by address, Twitter/X handle, ENS name, or profile ID.',
      inputSchema: {
        comment: z.string().optional().describe('Longer review comment'),
        identifier: z.string().describe('Address, Twitter/X handle, ENS name, or profile ID'),
        score: z.enum(['negative', 'neutral', 'positive']).describe('Review sentiment'),
        title: z.string().describe('Short review title'),
      },
    },
    async ({ comment, identifier, score, title }) => {
      const subject = await resolveReviewSubject(identifier, client);
      const result = await client.addReview({
        content: comment,
        score,
        subject,
        title,
        waitForTxTimeoutSeconds: 30,
      });
      return jsonResult(result);
    },
  );

  server.registerTool(
    'ethos_vouch',
    {
      description: 'Vouch for a user by staking credits on their reputation.',
      inputSchema: {
        amountCredits: CREDITS_SCHEMA.describe('Credits to stake'),
        identifier: z.string().describe('Address, Twitter/X handle, ENS name, or profile ID'),
      },
    },
    async ({ amountCredits, identifier }) => {
      const target = await resolveVouchTarget(identifier, client);
      const result = await client.vouchV2({
        amount: creditsToWei(amountCredits),
        target,
        waitForTxTimeoutSeconds: 30,
      });
      return jsonResult(result);
    },
  );
}

function registerTradeTools(server: McpServer, client: EchoClient, maxSpendCredits: number): void {
  const maxSpendWei = BigInt(creditsToWei(String(maxSpendCredits)));

  server.registerTool(
    'ethos_open_position',
    {
      description: `Open a position (long or short) in a market. Rejects requests over the ${maxSpendCredits}-credit per-call spend cap.`,
      inputSchema: {
        amountCredits: CREDITS_SCHEMA.describe('Credits to spend'),
        marketOnchainId: z.number().int().describe('On-chain market ID'),
        side: SIDE_SCHEMA,
        slippage: z
          .number()
          .min(0)
          .max(0.5)
          .optional()
          .describe('Max acceptable slippage as a fraction, e.g. 0.02 = 2% (default 0.02)'),
      },
    },
    async ({ amountCredits, marketOnchainId, side, slippage }) => {
      const paymentAmount = creditsToWei(amountCredits);

      if (BigInt(paymentAmount) > maxSpendWei) {
        throw new ValidationError(
          `Requested ${amountCredits} credits exceeds the per-call spend cap of ${maxSpendCredits} credits.`,
        );
      }

      const isPositive = side === 'long';
      const quote = await client.simulateOpen(marketOnchainId, {
        isPositive,
        paymentAmount,
        slippagePercentage: slippage,
      });
      const result = await client.marketV2Open({
        isPositive,
        marketOnchainId,
        minTokensOut: quote.minTokensOut,
        paymentAmount,
        waitForTxTimeoutSeconds: 30,
      });

      return jsonResult(result);
    },
  );

  server.registerTool(
    'ethos_close_position',
    {
      description: 'Close a position (long or short) in a market.',
      inputSchema: {
        marketOnchainId: z.number().int().describe('On-chain market ID'),
        side: SIDE_SCHEMA,
        slippage: z
          .number()
          .min(0)
          .max(0.5)
          .optional()
          .describe('Max acceptable slippage as a fraction, e.g. 0.02 = 2% (default 0.02)'),
        tokens: z.string().describe('Position tokens to close, e.g. "5" or "2.5"'),
      },
    },
    async ({ marketOnchainId, side, slippage, tokens }) => {
      const isPositive = side === 'long';
      const positionTokenAmount = creditsToWei(tokens);
      const quote = await client.simulateClose(marketOnchainId, {
        isPositive,
        positionTokenAmount,
        slippagePercentage: slippage,
      });
      const result = await client.marketV2Close({
        isPositive,
        marketOnchainId,
        minCreditsOut: quote.minCreditsOut,
        positionTokenAmount,
        waitForTxTimeoutSeconds: 30,
      });

      return jsonResult(result);
    },
  );
}
