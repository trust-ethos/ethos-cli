import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatAuctions, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class AuctionList extends Command {
  static description = 'List validator NFT auctions';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --status active',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
    status: Flags.string({
      description: 'Filter by status',
      options: ['pending', 'active', 'ended', 'settled'],
    }),
    limit: Flags.integer({ char: 'l', description: 'Max results', default: 10, min: 1, max: 100 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuctionList);
    const client = new EchoClient();

    try {
      const response = await client.getAuctions({ limit: flags.limit, status: flags.status });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatAuctions(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
