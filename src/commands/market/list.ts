import { Flags } from '@oclif/core';

import { type MarketOrderBy } from '../../lib/api/echo-client.js';
import { BaseCommand } from '../../lib/base-command.js';
import { formatMarkets, output } from '../../lib/formatting/output.js';

export default class MarketList extends BaseCommand {
  static aliases = ['ml'];
static description = 'List trust markets';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --sort priceChange24hPercent --order desc',
    '<%= config.bin %> <%= command.id %> --search "vitalik" --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results per request' }),
    offset: Flags.integer({ char: 'o', default: 0, description: 'Number of results to skip' }),
    order: Flags.string({
      default: 'desc',
      description: 'Sort direction',
      options: ['asc', 'desc'],
    }),
    search: Flags.string({ char: 's', description: 'Search by name/username' }),
    sort: Flags.string({
      default: 'marketCapWei',
      description: 'Sort by field',
      options: ['marketCapWei', 'volume24hWei', 'priceChange24hPercent', 'score', 'createdAt'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MarketList);

    try {
      const response = await this.withSpinner('Fetching markets', () =>
        this.client.getMarkets({
          filterQuery: flags.search,
          limit: flags.limit,
          offset: flags.offset,
          orderBy: flags.sort as MarketOrderBy,
          orderDirection: flags.order as 'asc' | 'desc',
        })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMarkets(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
