import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import pc from 'picocolors';

import { BaseCommand } from '../../lib/base-command.js';
import { getAccount, removeAccount } from '../../lib/config/credentials.js';
import { output } from '../../lib/formatting/output.js';

export default class AccountRemove extends BaseCommand {
  static args = {
    name: Args.string({ description: 'Account name to remove', required: true }),
  };
  static description = 'Remove a named Ethos account';
  static examples = [
    '<%= config.bin %> <%= command.id %> work',
    '<%= config.bin %> <%= command.id %> work --yes',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AccountRemove);
    const account = getAccount(args.name);

    if (!account) {
      this.error(`No account named "${args.name}".`, {
        exit: 1,
        suggestions: ['Run: ethos account list'],
      });
    }

    if (!flags.yes && !flags.json) {
      const confirmed = await confirm({
        message: `Remove account "${args.name}" (${account.user.displayName})?`,
      });

      if (!confirmed) {
        this.log(pc.dim('Cancelled.'));
        return;
      }
    }

    removeAccount(args.name);

    this.log(
      flags.json
        ? output({ account: args.name, status: 'removed' })
        : pc.green(`Removed account "${args.name}".`),
    );
  }
}
