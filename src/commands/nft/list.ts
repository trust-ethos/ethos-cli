import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatNfts, output } from '../../lib/formatting/output.js';

export default class NftList extends Command {
  static description = 'List NFTs owned by a user';

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> sethgho',
    '<%= config.bin %> <%= command.id %> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
      const user = await client.resolveUser(args.identifier);
      const userkey = client.getPrimaryUserkey(user);
      
      if (!userkey) {
        throw new Error('Could not determine userkey for user');
      }
      
      const response = await client.getNftsForUser(userkey, { limit: flags.limit, offset: flags.offset });

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
