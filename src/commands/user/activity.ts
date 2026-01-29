import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatActivities, output } from '../../lib/formatting/output.js';

export default class UserActivity extends Command {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Show recent reviews and vouches for a user';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> vitalik.eth --limit 5',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
  ];

  static flags = {
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of activities',
      default: 10,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed error information',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserActivity);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);
      const userkey = client.getPrimaryUserkey(user);
      
      if (!userkey) {
        this.error('User has no valid userkey for activity lookup', { exit: 1 });
      }

      const activities = await client.getActivities(userkey, ['review', 'vouch'], flags.limit);

      if (flags.json) {
        this.log(output({ user: user.username || user.displayName, activities }, flags));
      } else {
        this.log(formatActivities(activities, user.username || user.displayName));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
      throw error;
    }
  }
}
