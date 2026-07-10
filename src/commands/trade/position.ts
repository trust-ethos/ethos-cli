import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatMarketV2Position, output } from '../../lib/formatting/output.js';
import { parseAddressFlag } from '../../lib/validation/address.js';

export default class TradePosition extends BaseCommand {
  static args = {
    marketOnchainId: Args.integer({ description: 'On-chain market ID', required: true }),
  };
  static description = 'Show your position in a reputation market';
  static examples = [
    '<%= config.bin %> <%= command.id %> 123 --side long',
    '<%= config.bin %> <%= command.id %> 123 --side short --json',
    '<%= config.bin %> <%= command.id %> 123 --address 0x... --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    address: Flags.string({
      description: 'Wallet address to look up (defaults to your own wallet)',
    }),
    side: Flags.string({
      default: 'long',
      description: 'Position side',
      options: ['long', 'short'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TradePosition);
    const isPositive = flags.side === 'long';

    try {
      const userAddress = parseAddressFlag(flags.address, '--address');
      const position = await this.withSpinner('Fetching position', () =>
        this.client.marketV2Position(args.marketOnchainId, isPositive, userAddress),
      );

      if (flags.json) {
        this.log(output(position));
      } else {
        this.log(formatMarketV2Position(position));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
