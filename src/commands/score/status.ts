import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatScoreStatus, output } from '../../lib/formatting/output.js';

export default class ScoreStatus extends Command {
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
    const { args, flags } = await this.parse(ScoreStatus);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);
      const userkey = client.getPrimaryUserkey(user);
      if (!userkey) {
        this.error('Could not determine userkey for this user', { exit: 1 });
      }

      const status = await client.getScoreStatus(userkey);

      if (flags.json) {
        this.log(output({ ...status, identifier: args.identifier }));
      } else {
        this.log(formatScoreStatus({ ...status, identifier: args.identifier }));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
