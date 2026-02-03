import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatVotes, formatVoteStats, output } from '../../lib/formatting/output.js';

export default class SlashVotes extends BaseCommand {
  static args = {
    id: Args.integer({
      description: 'Slash ID',
      required: true,
    }),
  };
static description = 'Show votes on a slash';
static examples = [
    '<%= config.bin %> <%= command.id %> 195',
    '<%= config.bin %> <%= command.id %> 195 --stats',
    '<%= config.bin %> <%= command.id %> 195 --upvotes',
    '<%= config.bin %> <%= command.id %> 195 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    downvotes: Flags.boolean({
      description: 'Show only downvotes',
      exclusive: ['upvotes'],
    }),
    limit: Flags.integer({
      char: 'l',
      default: 10,
      description: 'Max results per request',
    }),
    offset: Flags.integer({
      char: 'o',
      default: 0,
      description: 'Number of results to skip',
    }),
    stats: Flags.boolean({
      char: 's',
      default: false,
      description: 'Show vote statistics only',
    }),
    upvotes: Flags.boolean({
      description: 'Show only upvotes',
      exclusive: ['downvotes'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SlashVotes);

    try {
      if (flags.stats) {
        const stats = await this.withSpinner('Fetching votes', () =>
          this.client.getVoteStats(args.id, 'slash')
        );
        if (flags.json) {
          this.log(output(stats));
        } else {
          this.log(formatVoteStats(stats, 'slash', args.id));
        }

        return;
      }

      const params: { isUpvote?: boolean; limit?: number; offset?: number } = {
        limit: flags.limit,
        offset: flags.offset,
      };

      if (flags.upvotes) params.isUpvote = true;
      if (flags.downvotes) params.isUpvote = false;

      const response = await this.withSpinner('Fetching votes', () =>
        this.client.getVotes(args.id, 'slash', params)
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVotes(response.values, response.total, 'slash'));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
