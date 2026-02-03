import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatReview, output } from '../../lib/formatting/output.js';

export default class ReviewInfo extends BaseCommand {
  static aliases = ['ri'];

  static args = {
    id: Args.integer({
      description: 'Review ID',
      required: true,
    }),
  };

  static description = 'Get details of a specific review';

  static examples = [
    '<%= config.bin %> <%= command.id %> 1139',
    '<%= config.bin %> <%= command.id %> 1139 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewInfo);

    try {
      const review = await this.withSpinner('Fetching review', () => this.client.getReview(args.id));

      if (flags.json) {
        this.log(output(review));
      } else {
        this.log(formatReview(review));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
