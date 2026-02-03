import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatListings, output } from '../../lib/formatting/output.js';

export default class ListingList extends BaseCommand {
  static description = 'List projects on Ethos Listings';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --status active',
    '<%= config.bin %> <%= command.id %> --limit 20 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results per request' }),
    offset: Flags.integer({ char: 'o', default: 0, description: 'Number of results to skip' }),
    status: Flags.string({
      default: 'active',
      description: 'Filter by status',
      options: ['active', 'pending', 'archived'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ListingList);

    try {
      const response = await this.withSpinner('Fetching listings', () =>
        this.client.getProjects({
          limit: flags.limit,
          offset: flags.offset,
          status: [flags.status.toUpperCase()],
        })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatListings(response.projects, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
