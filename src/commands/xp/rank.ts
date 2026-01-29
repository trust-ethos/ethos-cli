import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatRank, output } from '../../lib/formatting/output.js';

export default class XpRank extends Command {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Show leaderboard rank for a user';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
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
    const { args, flags } = await this.parse(XpRank);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);
      const userkey = client.getPrimaryUserkey(user);
      
      if (!userkey) {
        this.error('User has no valid userkey for XP lookup', { exit: 1 });
      }

      const rank = await client.getLeaderboardRank(userkey);

      if (flags.json) {
        this.log(output({ rank, user: user.username || user.displayName, userkey }, flags));
      } else {
        this.log(formatRank({ rank, userkey, username: user.username || user.displayName }));
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
