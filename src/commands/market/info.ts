import { Args } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatMarket, output } from '../../lib/formatting/output.js';

export default class MarketInfo extends BaseCommand {
  static aliases = ['mi'];
static args = {
    identifier: Args.string({ description: 'Profile ID or Twitter username', required: true }),
  };
static description = 'Get trust market info for a user';
static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> vitalik',
    '<%= config.bin %> <%= command.id %> vitalik --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MarketInfo);

    try {
      // Try as profileId first, then as Twitter username
      const isNumeric = /^\d+$/.test(args.identifier);
      let market;

      if (isNumeric) {
        market = await this.withSpinner('Fetching market info', () =>
          this.client.getMarketInfo(Number.parseInt(args.identifier, 10))
        );
      } else {
        const marketUser = await this.withSpinner('Fetching market info', () =>
          this.client.getMarketByTwitter(args.identifier)
        );
        market = await this.withSpinner('Fetching market info', () =>
          this.client.getMarketInfo(marketUser.profileId)
        );
      }

      if (flags.json) {
        this.log(output(market));
      } else {
        this.log(formatMarket(market));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
