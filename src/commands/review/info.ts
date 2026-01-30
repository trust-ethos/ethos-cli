import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatReview, output } from '../../lib/formatting/output.js';

export default class ReviewInfo extends Command {
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
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed error information',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewInfo);
    const client = new EchoClient();

    try {
      const review = await client.getReview(args.id);

      if (flags.json) {
        this.log(output(review));
      } else {
        this.log(formatReview(review));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
