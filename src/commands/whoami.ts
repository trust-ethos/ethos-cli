import pc from 'picocolors';

import { BaseCommand } from '../lib/base-command.js';
import { getAccount, getActiveAccount } from '../lib/config/credentials.js';
import { output } from '../lib/formatting/output.js';

export default class Whoami extends BaseCommand {
  static description = 'Show the currently signed-in Ethos account';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --account work',
    '<%= config.bin %> <%= command.id %> --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Whoami);
    const account = flags.account ? getAccount(flags.account) : getActiveAccount();

    if (!account) {
      if (flags.json) {
        this.log(output({ signedIn: false }));
        return;
      }

      this.error('Not signed in.', { exit: 1, suggestions: ['Run: ethos login'] });
    }

    const { name, user } = account;

    if (flags.json) {
      this.log(output({ account: name, signedIn: true, user }));
      return;
    }

    const profileSuffix = user.profileId ? ` ${pc.dim(`(profile ${user.profileId})`)}` : '';
    this.log(`${pc.bold(user.displayName)}${profileSuffix}`);
    if (user.username) {
      this.log(`${pc.dim('Username:')} @${user.username}`);
    }

    this.log(`${pc.dim('Account:')} ${name}`);
  }
}
