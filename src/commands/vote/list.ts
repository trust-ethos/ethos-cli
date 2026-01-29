import { Args, Command, Flags } from '@oclif/core';
import { EchoClient, type VoteType } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatVotes, output } from '../../lib/formatting/output.js';

export default class VoteList extends Command {
  static args = {
    id: Args.integer({
      description: 'Activity ID (review, vouch, or slash)',
      required: true,
    }),
  };

  static description = 'List votes on an activity';

  static examples = [
    '<%= config.bin %> <%= command.id %> 123 --type review',
    '<%= config.bin %> <%= command.id %> 456 --type slash --upvotes',
    '<%= config.bin %> <%= command.id %> 789 --type vouch --downvotes --json',
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
    type: Flags.string({
      char: 't',
      description: 'Activity type',
      required: true,
      options: ['review', 'vouch', 'slash'],
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
      description: 'Max results',
      default: 10,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VoteList);
    const client = new EchoClient();

    try {
      const params: { isUpvote?: boolean; limit?: number } = {
        limit: flags.limit,
      };

      if (flags.upvotes) params.isUpvote = true;
      if (flags.downvotes) params.isUpvote = false;

      const response = await client.getVotes(args.id, flags.type as VoteType, params);

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVotes(response.values, response.total, flags.type));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
