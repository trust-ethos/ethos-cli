import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatMarket, output } from '../../lib/formatting/output.js';

export default class MarketInfo extends Command {
  static aliases = ['mi'];

  static description = 'Get trust market info for a user';

  static args = {
    identifier: Args.string({ description: 'Profile ID or Twitter username', required: true }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> vitalik',
    '<%= config.bin %> <%= command.id %> vitalik --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MarketInfo);
    const client = new EchoClient();

    try {
      // Try as profileId first, then as Twitter username
      const isNumeric = /^\d+$/.test(args.identifier);
      let market;

      if (isNumeric) {
        market = await client.getMarketInfo(parseInt(args.identifier));
      } else {
        const marketUser = await client.getMarketByTwitter(args.identifier);
        market = await client.getMarketInfo(marketUser.profileId);
      }

      if (flags.json) {
        this.log(output(market));
      } else {
        this.log(formatMarket(market));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
