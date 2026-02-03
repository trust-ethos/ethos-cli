import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatListingVoters, output } from '../../lib/formatting/output.js';

export default class ListingVoters extends BaseCommand {
  static args = {
    projectId: Args.integer({ description: 'Project ID', required: true }),
  };
static description = 'Show voters for a listing/project';
static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --sentiment bullish',
    '<%= config.bin %> <%= command.id %> 123 --limit 20 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results per request' }),
    offset: Flags.integer({ char: 'o', default: 0, description: 'Number of results to skip' }),
    sentiment: Flags.string({
      description: 'Filter by sentiment',
      options: ['bullish', 'bearish'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ListingVoters);

    try {
      const response = await this.withSpinner('Fetching voters', () =>
        this.client.getProjectVoters(args.projectId, {
          limit: flags.limit,
          offset: flags.offset,
          sentiment: flags.sentiment as 'bearish' | 'bullish' | undefined,
        })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatListingVoters(response.values, response.totals));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
