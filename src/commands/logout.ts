import { Flags } from '@oclif/core';
import pc from 'picocolors';

import { BaseCommand } from '../lib/base-command.js';
import { clearAllAccounts, getActiveAccount, removeAccount } from '../lib/config/credentials.js';
import { output } from '../lib/formatting/output.js';

export default class Logout extends BaseCommand {
  static description = 'Sign out of Ethos on this device';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --account work',
    '<%= config.bin %> <%= command.id %> --all',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    all: Flags.boolean({ default: false, description: 'Sign out of every account' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Logout);

    if (flags.all) {
      clearAllAccounts();
      this.log(
        flags.json ? output({ status: 'signed_out_all' }) : pc.green('Signed out of all accounts.'),
      );
      return;
    }

    const targetName = flags.account ?? getActiveAccount()?.name;

    if (!targetName) {
      this.log(flags.json ? output({ status: 'not_signed_in' }) : pc.dim('Not signed in.'));
      return;
    }

    removeAccount(targetName);

    this.log(
      flags.json
        ? output({ account: targetName, status: 'signed_out' })
        : pc.green(`Signed out of ${targetName}.`),
    );
  }
}
