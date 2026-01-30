import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatRank, output } from '../../lib/formatting/output.js';

export default class XpRank extends Command {
  static aliases = ['rank'];

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Show leaderboard rank for a user';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> 0xNowater --season 2',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
  ];

  static flags = {
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
    season: Flags.integer({
      char: 's',
      description: 'Show XP for specific season',
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
          throw new Error('User has no valid userkey for XP lookup');
        }

        const rankIndex = await client.getLeaderboardRank(userkey);
        const rank = rankIndex + 1;

        let seasonXp: number | undefined;
        if (flags.season) {
          seasonXp = await client.getXpBySeason(userkey, flags.season);
        }

         if (flags.json) {
           const output_data: any = { rank, user: user.username || user.displayName, userkey };
           if (seasonXp !== undefined) {
             output_data.seasonXp = seasonXp;
             output_data.season = flags.season;
           }
           this.log(output(output_data));
         } else {
           const formatData: any = { rank, userkey, username: user.username || user.displayName };
           if (seasonXp !== undefined) {
             formatData.seasonXp = seasonXp;
             formatData.season = flags.season;
           }
           this.log(formatRank(formatData));
         }
       } catch (error) {
         if (error instanceof Error) {
           this.log(formatError(error, flags.verbose));
           this.exit(1);
         }
       }
  }
}
