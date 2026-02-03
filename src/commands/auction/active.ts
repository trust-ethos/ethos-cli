import { Flags } from '@oclif/core';
import pc from 'picocolors';
import { BaseCommand } from '../../lib/base-command.js';
import { formatAuction, output } from '../../lib/formatting/output.js';

export default class AuctionActive extends BaseCommand {
  static description = 'Show the currently active auction';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuctionActive);

    try {
      const auction = await this.withSpinner('Fetching active auction', () =>
        this.client.getActiveAuction()
      );

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
      this.handleError(error, flags.verbose);
    }
  }
}
