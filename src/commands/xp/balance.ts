import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatXP, output } from '../../lib/formatting/output.js';
import { parseUserkey } from '../../lib/validation/userkey.js';

export default class XpBalance extends Command {
  static args = {
    userkey: Args.string({
      description: 'Username, address, or userkey identifier',
      required: true,
    }),
  };

  static description = 'Check total XP balance for a user';

  static examples = [
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
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
    const { args, flags } = await this.parse(XpBalance);
    const client = new EchoClient();
    const userkey = parseUserkey(args.userkey);

    try {
      const totalXp = await client.getTotalXp(userkey) as number;

      if (flags.json) {
        this.log(output({ totalXp, userkey }, flags));
      } else {
        this.log(formatXP({ totalXp, userkey }));
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
