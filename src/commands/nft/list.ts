import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatNfts, output } from '../../lib/formatting/output.js';

export default class NftList extends BaseCommand {
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
    ...BaseCommand.baseFlags,
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

    try {
      const user = await this.withSpinner('Resolving user', () =>
        this.client.resolveUser(args.identifier)
      );
      const userkey = this.client.getPrimaryUserkey(user);
      
      if (!userkey) {
        this.error('Could not determine userkey for user');
      }
      
      const response = await this.withSpinner('Fetching NFTs', () =>
        this.client.getNftsForUser(userkey, { limit: flags.limit, offset: flags.offset })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatNfts(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
