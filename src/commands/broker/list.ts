import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { type BrokerPostType, type BrokerSortBy } from '../../lib/api/echo-client.js';
import { formatBrokerPosts, output } from '../../lib/formatting/output.js';

const TYPE_MAP: Record<string, BrokerPostType> = {
  'sell': 'SELL',
  'buy': 'BUY',
  'hire': 'HIRE',
  'for-hire': 'FOR_HIRE',
  'bounty': 'BOUNTY',
};

export default class BrokerList extends BaseCommand {
  static description = 'List broker posts (jobs, services, bounties)';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --type hire',
    '<%= config.bin %> <%= command.id %> --search "solidity developer"',
    '<%= config.bin %> <%= command.id %> --type sell --limit 5 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
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
    limit: Flags.integer({ char: 'l', description: 'Max results per request', default: 10 }),
    offset: Flags.integer({ char: 'o', description: 'Number of results to skip', default: 0 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BrokerList);

    try {
      const response = await this.withSpinner('Fetching broker posts', () =>
        this.client.getBrokerPosts({
          type: flags.type ? TYPE_MAP[flags.type] : undefined,
          search: flags.search,
          sortBy: flags.sort as BrokerSortBy,
          limit: flags.limit,
          offset: flags.offset,
        })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatBrokerPosts(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
