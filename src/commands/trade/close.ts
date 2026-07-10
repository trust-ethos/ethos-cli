import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import pc from 'picocolors';

import { BaseCommand } from '../../lib/base-command.js';
import { creditsToWei, parseSlippage, weiToCredits } from '../../lib/formatting/amount.js';
import { formatMarketV2TxResult, output } from '../../lib/formatting/output.js';

export default class TradeClose extends BaseCommand {
  static args = {
    marketOnchainId: Args.integer({ description: 'On-chain market ID', required: true }),
  };
  static description = 'Close a position in a reputation market';
  static examples = [
    '<%= config.bin %> <%= command.id %> 123 --side long --tokens 5',
    '<%= config.bin %> <%= command.id %> 123 --side short --tokens 5 --slippage 0.05 --yes',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    'min-credits': Flags.string({
      description: 'Minimum credits to accept, in wei (defaults to a quote-derived value)',
    }),
    side: Flags.string({
      description: 'Position side',
      options: ['long', 'short'],
      required: true,
    }),
    slippage: Flags.string({
      default: '0.02',
      description: 'Max acceptable slippage as a fraction (e.g. 0.02 = 2%)',
    }),
    tokens: Flags.string({ description: 'Position tokens to close', required: true }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TradeClose);

    try {
      const isPositive = flags.side === 'long';
      const positionTokenAmount = creditsToWei(flags.tokens);
      const slippagePercentage = parseSlippage(flags.slippage);

      let minCreditsOut = flags['min-credits'];

      if (!minCreditsOut) {
        // No seller override here: the close always executes against the
        // caller's own wallet (resolved server-side), so the quote must be
        // priced against that same wallet.
        const quote = await this.withSpinner('Fetching quote', () =>
          this.client.simulateClose(args.marketOnchainId, {
            isPositive,
            positionTokenAmount,
            slippagePercentage,
          }),
        );
        minCreditsOut = quote.minCreditsOut;
      }

      if (!flags.yes && !flags.json) {
        const confirmed = await confirm({
          message: `Close a ${flags.side} position on market #${args.marketOnchainId} for ${flags.tokens} tokens (min ${weiToCredits(minCreditsOut)} credits out)?`,
        });

        if (!confirmed) {
          this.log(pc.dim('Cancelled.'));
          return;
        }
      }

      const result = await this.withSpinner('Closing position', () =>
        this.client.marketV2Close({
          isPositive,
          marketOnchainId: args.marketOnchainId,
          minCreditsOut,
          positionTokenAmount,
          waitForTxTimeoutSeconds: 30,
        }),
      );

      this.log(flags.json ? output(result) : formatMarketV2TxResult(result, 'Position close'));
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
