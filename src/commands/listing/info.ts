import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatListing, output } from '../../lib/formatting/output.js';

export default class ListingInfo extends BaseCommand {
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
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ListingInfo);

    try {
      const isNumeric = /^\d+$/.test(args.identifier);
      const project = isNumeric 
        ? await this.withSpinner('Fetching listing', () =>
            this.client.getProjectDetails(parseInt(args.identifier))
          )
        : await this.withSpinner('Fetching listing', () =>
            this.client.getProjectByUsername(args.identifier)
          );

      if (flags.json) {
        this.log(output(project));
      } else {
        this.log(formatListing(project));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
