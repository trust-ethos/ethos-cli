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
    '<%= config.bin %> <%= command.id %> 0xNowater --type vouch',
    '<%= config.bin %> <%= command.id %> 0xNowater --type review --limit 5',
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
    type: Flags.string({
      char: 't',
      description: 'Filter by activity type',
      options: ['vouch', 'review'],
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed error information',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserActivity);

    if (flags.limit < 1 || flags.limit > 100) {
      this.error('limit must be between 1 and 100', { exit: 2 });
    }

    const client = new EchoClient();

       try {
        const user = await client.resolveUser(args.identifier);
        const userkey = client.getPrimaryUserkey(user);
        
        if (!userkey) {
          throw new Error('User has no valid userkey for activity lookup');
        }

        const types: Array<'review' | 'vouch'> = flags.type 
          ? [flags.type as 'review' | 'vouch'] 
          : ['review', 'vouch'];

        const activities = await client.getActivities(userkey, types, flags.limit);

        if (flags.json) {
          this.log(output({ user: user.username || user.displayName, activities }));
        } else {
          this.log(formatActivities(activities, user.username || user.displayName));
        }
      } catch (error) {
        if (error instanceof Error) {
          this.log(formatError(error, flags.verbose));
          this.exit(1);
        }
      }
   }
}
