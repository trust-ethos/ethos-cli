import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatMutualVouchers, output } from '../../lib/formatting/output.js';

export default class VouchMutual extends Command {
  static args = {
    viewer: Args.string({
      description: 'Viewer user (Twitter username, ETH address, or ENS name)',
      required: true,
    }),
    target: Args.string({
      description: 'Target user (Twitter username, ETH address, or ENS name)',
      required: true,
    }),
  };

  static description = 'Find mutual vouchers between two users';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater VitalikButerin',
    '<%= config.bin %> <%= command.id %> 0xNowater VitalikButerin --limit 20',
    '<%= config.bin %> <%= command.id %> 0xNowater VitalikButerin --json',
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
      description: 'Max results',
      default: 10,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchMutual);
    const client = new EchoClient();

    try {
      const [viewerUser, targetUser] = await Promise.all([
        client.resolveUser(args.viewer),
        client.resolveUser(args.target),
      ]);

      if (!viewerUser.profileId) {
        this.error(`User ${args.viewer} does not have an Ethos profile`, { exit: 1 });
      }

      if (!targetUser.profileId) {
        this.error(`User ${args.target} does not have an Ethos profile`, { exit: 1 });
      }

      const response = await client.getMutualVouchers(viewerUser.profileId, targetUser.profileId, { limit: flags.limit });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMutualVouchers(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
