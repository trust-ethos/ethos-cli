import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatInvitations, output } from '../../lib/formatting/output.js';

export default class UserInvitations extends Command {
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
    status: Flags.string({
      char: 's',
      description: 'Filter by status',
      options: ['INVITED', 'ACCEPTED'],
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
    const { args, flags } = await this.parse(UserInvitations);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);

      if (!user.profileId) {
        this.error('User does not have a profile ID', { exit: 1 });
      }

      const response = await client.getInvitations({
        senderProfileId: user.profileId,
        status: flags.status as 'INVITED' | 'ACCEPTED' | undefined,
        limit: flags.limit,
        offset: flags.offset,
      });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatInvitations(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
