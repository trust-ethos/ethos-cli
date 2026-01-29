import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatListingVoters, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class ListingVoters extends Command {
  static description = 'Show voters for a listing/project';

  static args = {
    projectId: Args.integer({ description: 'Project ID', required: true }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --sentiment bullish',
    '<%= config.bin %> <%= command.id %> 123 --limit 20 --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
    sentiment: Flags.string({
      description: 'Filter by sentiment',
      options: ['bullish', 'bearish'],
    }),
    limit: Flags.integer({ char: 'l', description: 'Max results per request', default: 10 }),
    offset: Flags.integer({ char: 'o', description: 'Number of results to skip', default: 0 }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ListingVoters);
    const client = new EchoClient();

    try {
      const response = await client.getProjectVoters(args.projectId, {
        limit: flags.limit,
        offset: flags.offset,
        sentiment: flags.sentiment as 'bullish' | 'bearish' | undefined,
      });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatListingVoters(response.values, response.totals));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
