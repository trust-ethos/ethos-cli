import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatReviews, output } from '../../lib/formatting/output.js';

export default class ReviewList extends BaseCommand {
  static aliases = ['rl'];

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'List reviews for a user';

  static examples = [
    '<%= config.bin %> <%= command.id %> sethgho',
    '<%= config.bin %> <%= command.id %> 0xNowater --limit 20',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Max results per request',
      default: 10,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Number of results to skip',
      default: 0,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewList);

    try {
      const user = await this.withSpinner('Resolving user', () => this.client.resolveUser(args.identifier));
      const userkey = this.client.getPrimaryUserkey(user);

      if (!userkey) {
        this.error('Could not determine userkey for user', { exit: 1 });
      }

      const reviews = await this.withSpinner('Fetching reviews', () =>
        this.client.getReviewsForUser(userkey!, {
          limit: flags.limit,
          offset: flags.offset,
        })
      );

      if (flags.json) {
        this.log(output(reviews));
      } else {
        this.log(formatReviews(reviews, reviews.length));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
