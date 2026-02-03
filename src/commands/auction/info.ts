import { Args } from '@oclif/core';

import { type Auction } from '../../lib/api/echo-client.js';
import { BaseCommand } from '../../lib/base-command.js';
import { formatAuction, output } from '../../lib/formatting/output.js';

export default class AuctionInfo extends BaseCommand {
  static args = {
    id: Args.integer({ description: 'Auction ID', required: true }),
  };
static description = 'Get details of a specific auction';
static examples = [
    '<%= config.bin %> <%= command.id %> 1',
    '<%= config.bin %> <%= command.id %> 1 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuctionInfo);

    try {
      let auction: Auction = await this.withSpinner('Fetching auction', () =>
        this.client.getAuction(args.id)
      );

      if (auction.buyerAddress) {
        try {
          const buyer = await this.client.getUserByAddress(auction.buyerAddress);
          auction = { ...auction, buyerUser: { displayName: buyer.displayName, username: buyer.username } };
        } catch {
          auction = { ...auction, buyerUser: null };
        }
      }

      if (flags.json) {
        this.log(output(auction));
      } else {
        this.log(formatAuction(auction));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
