import { BaseCommand } from '../../lib/base-command.js';
import { listAccounts } from '../../lib/config/credentials.js';
import { formatAccounts, output } from '../../lib/formatting/output.js';

export default class AccountList extends BaseCommand {
  static description = 'List your named Ethos accounts';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AccountList);
    const accounts = listAccounts();

    this.log(flags.json ? output(accounts) : formatAccounts(accounts));
  }
}
