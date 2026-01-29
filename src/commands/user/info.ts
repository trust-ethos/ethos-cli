import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatUser, output } from '../../lib/formatting/output.js';

export default class UserInfo extends Command {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Display user profile by username, address, or ENS name';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
    const { args, flags } = await this.parse(UserInfo);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);

      if (flags.json) {
        this.log(output(user, flags));
      } else {
        this.log(formatUser(user));
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
