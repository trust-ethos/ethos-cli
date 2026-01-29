import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatNfts, output } from '../../lib/formatting/output.js';

export default class NftList extends Command {
  static description = 'List NFTs owned by a user';

  static args = {
    userkey: Args.string({
      description: 'User key (address, profileId, or twitter:username)',
      required: true,
    }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 0x1234...',
    '<%= config.bin %> <%= command.id %> twitter:vitalik',
    '<%= config.bin %> <%= command.id %> profileId:123 --json',
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
    limit: Flags.integer({
      char: 'l',
      description: 'Max results per request',
      default: 10,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Number of results to skip',
      default: 0,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(NftList);
    const client = new EchoClient();

    try {
      const response = await client.getNftsForUser(args.userkey, { limit: flags.limit, offset: flags.offset });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatNfts(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
