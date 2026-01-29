import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatMarketHolders, output } from '../../lib/formatting/output.js';

export default class MarketHolders extends Command {
  static description = 'Show who holds trust/distrust in a user';

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> sethgho',
    '<%= config.bin %> <%= command.id %> 0xNowater --limit 20',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
    limit: Flags.integer({ char: 'l', description: 'Max results', default: 10, min: 1, max: 100 }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MarketHolders);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);

      if (!user.profileId) {
        this.error('User does not have a profile ID', { exit: 1 });
      }

      const response = await client.getMarketHolders(user.profileId, { limit: flags.limit });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMarketHolders(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
