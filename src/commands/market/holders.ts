import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatMarketHolders, output } from '../../lib/formatting/output.js';

export default class MarketHolders extends BaseCommand {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };
static description = 'Show who holds trust/distrust in a user';
static examples = [
    '<%= config.bin %> <%= command.id %> sethgho',
    '<%= config.bin %> <%= command.id %> 0xNowater --limit 20',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results', max: 100, min: 1 }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MarketHolders);

    try {
      const user = await this.withSpinner('Fetching holders', () =>
        this.client.resolveUser(args.identifier)
      );

      if (!user.profileId) {
        this.error('User does not have a profile ID', { exit: 1 });
      }

      const response = await this.withSpinner('Fetching holders', () =>
        this.client.getMarketHolders(user.profileId as number, { limit: flags.limit })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMarketHolders(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
