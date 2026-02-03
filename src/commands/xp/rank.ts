import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatRank, output } from '../../lib/formatting/output.js';

export default class XpRank extends BaseCommand {
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
    ...BaseCommand.baseFlags,
    season: Flags.integer({
      char: 's',
      description: 'Show XP for specific season',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(XpRank);

    try {
      const user = await this.withSpinner('Fetching rank', () =>
        this.client.resolveUser(args.identifier)
      );
      const userkey = this.client.getPrimaryUserkey(user);

      if (!userkey) {
        throw new Error('User has no valid userkey for XP lookup');
      }

      const rankIndex = await this.client.getLeaderboardRank(userkey);
      const rank = rankIndex + 1;

      let seasonXp: number | undefined;
      if (flags.season) {
        seasonXp = await this.client.getXpBySeason(userkey, flags.season);
      }

      if (flags.json) {
        const outputData: { rank: number; season?: number; seasonXp?: number; user: string; userkey: string } = { 
          rank, 
          user: user.username || user.displayName, 
          userkey 
        };
        if (seasonXp !== undefined) {
          outputData.seasonXp = seasonXp;
          outputData.season = flags.season;
        }

        this.log(output(outputData));
      } else {
        const formatData: { rank: number; season?: number; seasonXp?: number; userkey: string; username: string } = { 
          rank, 
          userkey, 
          username: user.username || user.displayName 
        };
        if (seasonXp !== undefined) {
          formatData.seasonXp = seasonXp;
          formatData.season = flags.season;
        }

        this.log(formatRank(formatData));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
