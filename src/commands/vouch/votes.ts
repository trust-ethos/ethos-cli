import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatVotes, formatVoteStats, output } from '../../lib/formatting/output.js';

export default class VouchVotes extends Command {
  static args = {
    id: Args.integer({
      description: 'Vouch ID',
      required: true,
    }),
  };

  static description = 'Show votes on a vouch';

  static examples = [
    '<%= config.bin %> <%= command.id %> 182',
    '<%= config.bin %> <%= command.id %> 182 --stats',
    '<%= config.bin %> <%= command.id %> 182 --upvotes',
    '<%= config.bin %> <%= command.id %> 182 --json',
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
    const { args, flags } = await this.parse(VouchVotes);
    const client = new EchoClient();

    try {
      if (flags.stats) {
        const stats = await client.getVoteStats(args.id, 'vouch');
        if (flags.json) {
          this.log(output(stats));
        } else {
          this.log(formatVoteStats(stats, 'vouch', args.id));
        }
        return;
      }

      const params: { isUpvote?: boolean; limit?: number; offset?: number } = {
        limit: flags.limit,
        offset: flags.offset,
      };

      if (flags.upvotes) params.isUpvote = true;
      if (flags.downvotes) params.isUpvote = false;

      const response = await client.getVotes(args.id, 'vouch', params);

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVotes(response.values, response.total, 'vouch'));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
