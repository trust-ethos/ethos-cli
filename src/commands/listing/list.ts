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
    status: Flags.string({
      description: 'Filter by status',
      options: ['active', 'pending', 'archived'],
      default: 'active',
    }),
    limit: Flags.integer({ char: 'l', description: 'Max results per request', default: 10 }),
    offset: Flags.integer({ char: 'o', description: 'Number of results to skip', default: 0 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ListingList);

    try {
      const response = await this.withSpinner('Fetching listings', () =>
        this.client.getProjects({
          status: [flags.status.toUpperCase()],
          limit: flags.limit,
          offset: flags.offset,
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
