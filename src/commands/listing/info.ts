import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatListing, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class ListingInfo extends Command {
  static description = 'Get details of a specific listing/project';

  static args = {
    identifier: Args.string({ description: 'Project ID or username', required: true }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> uniswap',
    '<%= config.bin %> <%= command.id %> uniswap --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ListingInfo);
    const client = new EchoClient();

    try {
      const isNumeric = /^\d+$/.test(args.identifier);
      const project = isNumeric 
        ? await client.getProjectDetails(parseInt(args.identifier))
        : await client.getProjectByUsername(args.identifier);

      if (flags.json) {
        this.log(output(project));
      } else {
        this.log(formatListing(project));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
