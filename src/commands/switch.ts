import { Args } from '@oclif/core';
import pc from 'picocolors';

import { BaseCommand } from '../lib/base-command.js';
import { getAccount, setActiveAccount } from '../lib/config/credentials.js';
import { output } from '../lib/formatting/output.js';

export default class Switch extends BaseCommand {
  static args = {
    name: Args.string({ description: 'Account name to switch to', required: true }),
  };
  static description = 'Switch the active Ethos account';
  static examples = [
    '<%= config.bin %> <%= command.id %> work',
    '<%= config.bin %> <%= command.id %> work --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Switch);

    try {
      setActiveAccount(args.name);
    } catch (error) {
      this.handleError(error, flags.verbose);
    }

    const account = getAccount(args.name);

    if (!account) {
      this.error(`No account named "${args.name}".`, { exit: 1 });
    }

    const profileSuffix = account.user.profileId ? ` (profile ${account.user.profileId})` : '';

    this.log(
      flags.json
        ? output({ account: args.name, status: 'switched' })
        : pc.green(`Switched to ${args.name}${profileSuffix}`),
    );
  }
}
