import { Flags } from '@oclif/core';

import { type Auction } from '../../lib/api/echo-client.js';
import { BaseCommand } from '../../lib/base-command.js';
import { formatAuctions, output } from '../../lib/formatting/output.js';

export default class AuctionList extends BaseCommand {
  static description = 'List validator NFT auctions';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --status active',
    '<%= config.bin %> <%= command.id %> --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results per request' }),
    offset: Flags.integer({ char: 'o', default: 0, description: 'Number of results to skip' }),
    status: Flags.string({
      description: 'Filter by status',
      options: ['pending', 'active', 'ended', 'settled'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuctionList);

    try {
      const response = await this.withSpinner('Fetching auctions', () =>
        this.client.getAuctions({ limit: flags.limit, offset: flags.offset, status: flags.status })
      );

      const enrichedAuctions = await this.enrichWithBuyerInfo(response.values);

      if (flags.json) {
        this.log(output({ ...response, values: enrichedAuctions }));
      } else {
        this.log(formatAuctions(enrichedAuctions, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }

  private async enrichWithBuyerInfo(auctions: Auction[]): Promise<Auction[]> {
    const buyerAddresses = [...new Set(auctions.filter(a => a.buyerAddress).map(a => a.buyerAddress!))];
    
    if (buyerAddresses.length === 0) return auctions;

    const buyerMap = new Map<string, { displayName?: string; username?: null | string }>();
    
    await Promise.all(
      buyerAddresses.map(async (address) => {
        try {
          const user = await this.client.getUserByAddress(address);
          buyerMap.set(address, { displayName: user.displayName, username: user.username });
        } catch {
          buyerMap.set(address, {});
        }
      })
    );

    return auctions.map(auction => ({
      ...auction,
      buyerUser: auction.buyerAddress ? buyerMap.get(auction.buyerAddress) : null,
    }));
  }
}
