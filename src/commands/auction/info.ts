import { Args, Command, Flags } from '@oclif/core';
import { EchoClient, type Auction } from '../../lib/api/echo-client.js';
import { formatAuction, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class AuctionInfo extends Command {
  static description = 'Get details of a specific auction';

  static args = {
    id: Args.integer({ description: 'Auction ID', required: true }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 1',
    '<%= config.bin %> <%= command.id %> 1 --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuctionInfo);
    const client = new EchoClient();

    try {
      let auction: Auction = await client.getAuction(args.id);

      if (auction.buyerAddress) {
        try {
          const buyer = await client.getUserByAddress(auction.buyerAddress);
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
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
