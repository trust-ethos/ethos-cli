import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatMutualVouchers, output } from '../../lib/formatting/output.js';

export default class VouchMutual extends BaseCommand {
  static args = {
    target: Args.string({
      description: 'Target user (Twitter username, ETH address, or ENS name)',
      required: true,
    }),
    viewer: Args.string({
      description: 'Viewer user (Twitter username, ETH address, or ENS name)',
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
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      default: 10,
      description: 'Max results',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchMutual);

    try {
      const [viewerUser, targetUser] = await this.withSpinner('Finding mutual vouchers', () =>
        Promise.all([this.client.resolveUser(args.viewer), this.client.resolveUser(args.target)])
      );

      if (!viewerUser.profileId) {
        this.error(`User ${args.viewer} does not have an Ethos profile`, { exit: 1 });
      }

      if (!targetUser.profileId) {
        this.error(`User ${args.target} does not have an Ethos profile`, { exit: 1 });
      }

      const response = await this.withSpinner('Fetching mutual vouchers', () =>
        this.client.getMutualVouchers(viewerUser.profileId!, targetUser.profileId!, { limit: flags.limit })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatMutualVouchers(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
