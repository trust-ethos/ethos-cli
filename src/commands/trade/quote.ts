import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { ValidationError } from '../../lib/errors/cli-error.js';
import { creditsToWei, parseSlippage } from '../../lib/formatting/amount.js';
import { formatSimulateClose, formatSimulateOpen, output } from '../../lib/formatting/output.js';
import { parseAddressFlag } from '../../lib/validation/address.js';

export default class TradeQuote extends BaseCommand {
  static args = {
    marketOnchainId: Args.integer({ description: 'On-chain market ID', required: true }),
  };
  static description = 'Get a price quote for opening or closing a market position';
  static examples = [
    '<%= config.bin %> <%= command.id %> 123 --side long --amount 10',
    '<%= config.bin %> <%= command.id %> 123 --side long --close --tokens 5',
    '<%= config.bin %> <%= command.id %> 123 --side short --amount 10 --slippage 0.05 --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    amount: Flags.string({ char: 'a', description: 'Credits to spend (open quotes)' }),
    close: Flags.boolean({
      default: false,
      description: 'Quote closing a position instead of opening one',
    }),
    seller: Flags.string({
      description: 'Wallet address to price the close quote against (defaults to your own wallet)',
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
    tokens: Flags.string({ description: 'Position tokens to close (close quotes)' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TradeQuote);

    try {
      const isPositive = flags.side === 'long';
      const slippagePercentage = parseSlippage(flags.slippage);

      if (flags.close) {
        if (!flags.tokens) {
          throw new ValidationError('Close quotes require --tokens <amount>.');
        }

        const { tokens } = flags;
        const sellerAddress = parseAddressFlag(flags.seller, '--seller');
        const result = await this.withSpinner('Fetching close quote', () =>
          this.client.simulateClose(args.marketOnchainId, {
            isPositive,
            positionTokenAmount: creditsToWei(tokens),
            sellerAddress,
            slippagePercentage,
          }),
        );

        this.log(flags.json ? output(result) : formatSimulateClose(result));
        return;
      }

      if (!flags.amount) {
        throw new ValidationError('Open quotes require --amount <credits>.');
      }

      const { amount } = flags;
      const result = await this.withSpinner('Fetching open quote', () =>
        this.client.simulateOpen(args.marketOnchainId, {
          isPositive,
          paymentAmount: creditsToWei(amount),
          slippagePercentage,
        }),
      );

      this.log(flags.json ? output(result) : formatSimulateOpen(result));
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
