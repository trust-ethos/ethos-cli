import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatUser, output } from '../../lib/formatting/output.js';
import { parseUserkey } from '../../lib/validation/userkey.js';

export default class UserInfo extends Command {
  static args = {
    identifier: Args.string({
      description: 'Username or Ethereum address',
      required: true,
    }),
  };

  static description = 'Display user profile by username or address';

  static examples = [
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
    '<%= config.bin %> <%= command.id %> vitalik.eth --verbose',
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
    const userkey = parseUserkey(args.identifier);

    try {
      let user;

      // Try to determine if it's an address or username
      if (userkey.startsWith('address:')) {
        const address = userkey.replace('address:', '');
        user = await client.getUserByAddress(address);
      } else {
        // Treat as username
        user = await client.getUserByUsername(userkey);
      }

      if (flags.json) {
        this.log(output(user, flags));
      } else {
        this.log(formatUser(user));
      }
    } catch (error) {
      if (error instanceof Error) {
        // Don't use oclif's error handler - format our own
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
      throw error;
    }
  }
}
