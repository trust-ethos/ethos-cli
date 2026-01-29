import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatListings, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class ListingList extends Command {
  static description = 'List projects on Ethos Listings';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --status active',
    '<%= config.bin %> <%= command.id %> --limit 20 --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
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
    const client = new EchoClient();

    try {
      const response = await client.getProjects({
        status: [flags.status.toUpperCase()],
        limit: flags.limit,
        offset: flags.offset,
      });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatListings(response.projects, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
