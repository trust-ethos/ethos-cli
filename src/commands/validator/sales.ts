import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatValidatorListings, output } from '../../lib/formatting/output.js';

export default class ValidatorSales extends BaseCommand {
  static description = 'List validator NFTs for sale on OpenSea';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 20 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      default: 10,
      description: 'Max results per request',
    }),
    offset: Flags.integer({
      char: 'o',
      default: 0,
      description: 'Number of results to skip',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorSales);

    try {
      const response = await this.withSpinner('Fetching validator sales', () =>
        this.client.getValidatorListings({ limit: flags.limit, offset: flags.offset })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatValidatorListings(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
