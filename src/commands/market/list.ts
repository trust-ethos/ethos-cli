import { Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { type MarketOrderBy } from '../../lib/api/echo-client.js';
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
    sort: Flags.string({
      description: 'Sort by field',
      options: ['marketCapWei', 'volume24hWei', 'priceChange24hPercent', 'score', 'createdAt'],
      default: 'marketCapWei',
    }),
    order: Flags.string({
      description: 'Sort direction',
      options: ['asc', 'desc'],
      default: 'desc',
    }),
    search: Flags.string({ char: 's', description: 'Search by name/username' }),
    limit: Flags.integer({ char: 'l', description: 'Max results per request', default: 10 }),
    offset: Flags.integer({ char: 'o', description: 'Number of results to skip', default: 0 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MarketList);

    try {
      const response = await this.withSpinner('Fetching markets', () =>
        this.client.getMarkets({
          orderBy: flags.sort as MarketOrderBy,
          orderDirection: flags.order as 'asc' | 'desc',
          filterQuery: flags.search,
          limit: flags.limit,
          offset: flags.offset,
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
