import { Command, Flags } from '@oclif/core';
import { EchoClient, type BrokerPostType, type BrokerSortBy } from '../../lib/api/echo-client.js';
import { formatBrokerPosts, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

const TYPE_MAP: Record<string, BrokerPostType> = {
  'sell': 'SELL',
  'buy': 'BUY',
  'hire': 'HIRE',
  'for-hire': 'FOR_HIRE',
  'bounty': 'BOUNTY',
};

export default class BrokerList extends Command {
  static description = 'List broker posts (jobs, services, bounties)';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --type hire',
    '<%= config.bin %> <%= command.id %> --search "solidity developer"',
    '<%= config.bin %> <%= command.id %> --type sell --limit 5 --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
    type: Flags.string({
      char: 't',
      description: 'Filter by post type',
      options: ['sell', 'buy', 'hire', 'for-hire', 'bounty'],
    }),
    search: Flags.string({ char: 's', description: 'Search in title/description' }),
    sort: Flags.string({
      description: 'Sort order',
      options: ['newest', 'top', 'hot'],
      default: 'hot',
    }),
    limit: Flags.integer({ char: 'l', description: 'Max results', default: 10, min: 1, max: 100 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BrokerList);
    const client = new EchoClient();

    try {
      const response = await client.getBrokerPosts({
        type: flags.type ? TYPE_MAP[flags.type] : undefined,
        search: flags.search,
        sortBy: flags.sort as BrokerSortBy,
        limit: flags.limit,
      });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatBrokerPosts(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
