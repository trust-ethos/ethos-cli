import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatAuction, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class AuctionActive extends Command {
  static description = 'Show the currently active auction';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuctionActive);
    const client = new EchoClient();

    try {
      const auction = await client.getActiveAuction();

      if (!auction) {
        this.log(pc.yellow('No active auction at the moment.'));
        return;
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
