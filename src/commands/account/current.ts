import pc from 'picocolors';

import { BaseCommand } from '../../lib/base-command.js';
import { getActiveAccount } from '../../lib/config/credentials.js';
import { output } from '../../lib/formatting/output.js';

export default class AccountCurrent extends BaseCommand {
  static description = 'Show the active Ethos account';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AccountCurrent);
    const account = getActiveAccount();

    if (!account) {
      if (flags.json) {
        this.log(output({ signedIn: false }));
        return;
      }

      this.error('No active account.', { exit: 1, suggestions: ['Run: ethos login'] });
    }

    if (flags.json) {
      this.log(
        output({
          account: account.name,
          apiUrl: account.apiUrl,
          signedIn: true,
          user: account.user,
        }),
      );
      return;
    }

    const profileSuffix = account.user.profileId
      ? ` ${pc.dim(`(profile ${account.user.profileId})`)}`
      : '';
    this.log(`${pc.bold(account.name)}${profileSuffix}`);
    this.log(`${pc.dim('User:')} ${account.user.displayName}`);
    this.log(`${pc.dim('API:')} ${account.apiUrl}`);
  }
}
