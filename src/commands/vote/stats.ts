import { Args, Command, Flags } from '@oclif/core';
import { EchoClient, type VoteType } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatVoteStats, output } from '../../lib/formatting/output.js';

export default class VoteStats extends Command {
  static args = {
    id: Args.integer({
      description: 'Activity ID (review, vouch, or slash)',
      required: true,
    }),
  };

  static description = 'Get vote stats for an activity';

  static examples = [
    '<%= config.bin %> <%= command.id %> 123 --type review',
    '<%= config.bin %> <%= command.id %> 456 --type slash',
    '<%= config.bin %> <%= command.id %> 789 --type vouch --json',
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
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VoteStats);
    const client = new EchoClient();

    try {
      const stats = await client.getVoteStats(args.id, flags.type as VoteType);

      if (flags.json) {
        this.log(output({ ...stats, activityId: args.id, activityType: flags.type }));
      } else {
        this.log(formatVoteStats(stats, flags.type, args.id));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
