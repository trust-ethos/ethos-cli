import { Command, Flags } from '@oclif/core';
import { EchoClient, type MarketOrderBy } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatMarkets, output } from '../../lib/formatting/output.js';

export default class MarketList extends Command {
  static aliases = ['ml'];

  static description = 'List trust markets';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --sort priceChange24hPercent --order desc',
    '<%= config.bin %> <%= command.id %> --search "vitalik" --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
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
    const client = new EchoClient();

    try {
      const response = await client.getMarkets({
        orderBy: flags.sort as MarketOrderBy,
        orderDirection: flags.order as 'asc' | 'desc',
        filterQuery: flags.search,
        limit: flags.limit,
        offset: flags.offset,
      });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMarkets(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
