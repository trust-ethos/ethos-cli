import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatFeaturedMarkets, output } from '../../lib/formatting/output.js';

export default class MarketFeatured extends Command {
  static description = 'Show top gainers and losers';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MarketFeatured);
    const client = new EchoClient();

    try {
      const response = await client.getFeaturedMarkets();

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatFeaturedMarkets(response));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
