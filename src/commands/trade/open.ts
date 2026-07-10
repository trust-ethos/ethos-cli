import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import pc from 'picocolors';

import { BaseCommand } from '../../lib/base-command.js';
import { creditsToWei, parseSlippage, weiToCredits } from '../../lib/formatting/amount.js';
import { formatMarketV2TxResult, output } from '../../lib/formatting/output.js';

export default class TradeOpen extends BaseCommand {
  static args = {
    marketOnchainId: Args.integer({ description: 'On-chain market ID', required: true }),
  };
  static description = 'Open a position in a reputation market';
  static examples = [
    '<%= config.bin %> <%= command.id %> 123 --side long --amount 10',
    '<%= config.bin %> <%= command.id %> 123 --side short --amount 10 --slippage 0.05 --yes',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    amount: Flags.string({ char: 'a', description: 'Credits to spend', required: true }),
    'min-tokens': Flags.string({
      description: 'Minimum tokens to accept, in wei (defaults to a quote-derived value)',
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
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TradeOpen);

    try {
      const isPositive = flags.side === 'long';
      const paymentAmount = creditsToWei(flags.amount);
      const slippagePercentage = parseSlippage(flags.slippage);

      let minTokensOut = flags['min-tokens'];

      if (!minTokensOut) {
        const quote = await this.withSpinner('Fetching quote', () =>
          this.client.simulateOpen(args.marketOnchainId, {
            isPositive,
            paymentAmount,
            slippagePercentage,
          }),
        );
        minTokensOut = quote.minTokensOut;
      }

      if (!flags.yes && !flags.json) {
        const confirmed = await confirm({
          message: `Open a ${flags.side} position on market #${args.marketOnchainId} with ${flags.amount} credits (min ${weiToCredits(minTokensOut)} tokens out)?`,
        });

        if (!confirmed) {
          this.log(pc.dim('Cancelled.'));
          return;
        }
      }

      const result = await this.withSpinner('Opening position', () =>
        this.client.marketV2Open({
          isPositive,
          marketOnchainId: args.marketOnchainId,
          minTokensOut,
          paymentAmount,
          waitForTxTimeoutSeconds: 30,
        }),
      );

      this.log(flags.json ? output(result) : formatMarketV2TxResult(result, 'Position open'));
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
