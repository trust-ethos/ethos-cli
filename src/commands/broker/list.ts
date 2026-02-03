import { Flags } from '@oclif/core';

import { type BrokerPostType, type BrokerSortBy } from '../../lib/api/echo-client.js';
import { BaseCommand } from '../../lib/base-command.js';
import { formatBrokerPosts, output } from '../../lib/formatting/output.js';

const TYPE_MAP: Record<string, BrokerPostType> = {
  'bounty': 'BOUNTY',
  'buy': 'BUY',
  'for-hire': 'FOR_HIRE',
  'hire': 'HIRE',
  'sell': 'SELL',
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
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results per request' }),
    offset: Flags.integer({ char: 'o', default: 0, description: 'Number of results to skip' }),
    search: Flags.string({ char: 's', description: 'Search in title/description' }),
    sort: Flags.string({
      default: 'hot',
      description: 'Sort order',
      options: ['newest', 'top', 'hot'],
    }),
    type: Flags.string({
      char: 't',
      description: 'Filter by post type',
      options: ['sell', 'buy', 'hire', 'for-hire', 'bounty'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BrokerList);

    try {
      const response = await this.withSpinner('Fetching broker posts', () =>
        this.client.getBrokerPosts({
          limit: flags.limit,
          offset: flags.offset,
          search: flags.search,
          sortBy: flags.sort as BrokerSortBy,
          type: flags.type ? TYPE_MAP[flags.type] : undefined,
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
