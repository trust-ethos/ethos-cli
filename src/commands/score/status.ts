import { Args } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatScoreStatus, output } from '../../lib/formatting/output.js';

export default class ScoreStatus extends BaseCommand {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };
static description = 'Check score calculation status for a user';
static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ScoreStatus);

    try {
      const user = await this.withSpinner('Checking score status', () =>
        this.client.resolveUser(args.identifier)
      );
      const userkey = this.client.getPrimaryUserkey(user);
      if (!userkey) {
        this.error('Could not determine userkey for this user', { exit: 1 });
      }

      const status = await this.client.getScoreStatus(userkey);

      if (flags.json) {
        this.log(output({ ...status, identifier: args.identifier }));
      } else {
        this.log(formatScoreStatus({ ...status, identifier: args.identifier }));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
