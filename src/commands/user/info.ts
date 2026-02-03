import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatUser, output } from '../../lib/formatting/output.js';

export default class UserInfo extends BaseCommand {
  static aliases = ['u', 'ui'];

  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Display user profile by username, address, or ENS name';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserInfo);

    try {
      const user = await this.withSpinner('Fetching user', () =>
        this.client.resolveUser(args.identifier)
      );

      if (flags.json) {
        this.log(output(user));
      } else {
        this.log(formatUser(user));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
