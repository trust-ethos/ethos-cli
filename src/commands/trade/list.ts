import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatMarketsV2, output } from '../../lib/formatting/output.js';

export default class TradeList extends BaseCommand {
  static description = 'List reputation markets';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 20 --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results' }),
    search: Flags.string({ char: 's', description: 'Filter by name/username' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(TradeList);

    try {
      const response = await this.withSpinner('Fetching markets', () =>
        this.client.listMarketsV2({ filterQuery: flags.search, limit: flags.limit }),
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMarketsV2(response.values));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
