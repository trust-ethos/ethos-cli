import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatVotes, formatVoteStats, output } from '../../lib/formatting/output.js';

export default class SlashVotes extends Command {
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
    const { args, flags } = await this.parse(SlashVotes);
    const client = new EchoClient();

    try {
      if (flags.stats) {
        const stats = await client.getVoteStats(args.id, 'slash');
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

      const response = await client.getVotes(args.id, 'slash', params);

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVotes(response.values, response.total, 'slash'));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
