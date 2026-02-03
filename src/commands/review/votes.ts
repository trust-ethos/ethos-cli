import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatVotes, formatVoteStats, output } from '../../lib/formatting/output.js';

export default class ReviewVotes extends BaseCommand {
  static args = {
    id: Args.integer({
      description: 'Review ID',
      required: true,
    }),
  };

  static description = 'Show votes on a review';

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --stats',
    '<%= config.bin %> <%= command.id %> 123 --upvotes',
    '<%= config.bin %> <%= command.id %> 123 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    stats: Flags.boolean({
      char: 's',
      description: 'Show vote statistics only',
      default: false,
    }),
    upvotes: Flags.boolean({
      description: 'Show only upvotes',
      exclusive: ['downvotes'],
    }),
    downvotes: Flags.boolean({
      description: 'Show only downvotes',
      exclusive: ['upvotes'],
    }),
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
    const { args, flags } = await this.parse(ReviewVotes);

    try {
      if (flags.stats) {
        const stats = await this.withSpinner('Fetching vote stats', () => this.client.getVoteStats(args.id, 'review'));
        if (flags.json) {
          this.log(output(stats));
        } else {
          this.log(formatVoteStats(stats, 'review', args.id));
        }
        return;
      }

      const params: { isUpvote?: boolean; limit?: number; offset?: number } = {
        limit: flags.limit,
        offset: flags.offset,
      };

      if (flags.upvotes) params.isUpvote = true;
      if (flags.downvotes) params.isUpvote = false;

      const response = await this.withSpinner('Fetching votes', () => this.client.getVotes(args.id, 'review', params));

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVotes(response.values, response.total, 'review'));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
