import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatInvitations, output } from '../../lib/formatting/output.js';

export default class UserInvitations extends BaseCommand {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };
static description = 'List invitations sent by a user';
static examples = [
    '<%= config.bin %> <%= command.id %> sethgho',
    '<%= config.bin %> <%= command.id %> 0xNowater --status ACCEPTED',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      default: 10,
      description: 'Max results per request',
    }),
    offset: Flags.integer({
      char: 'o',
      default: 0,
      description: 'Number of results to skip',
    }),
    status: Flags.string({
      char: 's',
      description: 'Filter by status',
      options: ['INVITED', 'ACCEPTED'],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserInvitations);

    try {
      const user = await this.withSpinner('Fetching user', () =>
        this.client.resolveUser(args.identifier)
      );

      if (!user.profileId) {
        this.error('User does not have a profile ID', { exit: 1 });
      }

      const response = await this.withSpinner('Fetching invitations', () =>
        this.client.getInvitations({
          limit: flags.limit,
          offset: flags.offset,
          senderProfileId: user.profileId!,
          status: flags.status as 'ACCEPTED' | 'INVITED' | undefined,
        })
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatInvitations(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
