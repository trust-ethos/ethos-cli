import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatSearchResults, output } from '../../lib/formatting/output.js';

export default class UserSearch extends BaseCommand {
  static aliases = ['find'];

  static args = {
    query: Args.string({
      description: 'Search query',
      required: true,
    }),
  };

  static description = 'Search for users by name, username, or address';

  static examples = [
    '<%= config.bin %> <%= command.id %> vitalik',
    '<%= config.bin %> <%= command.id %> "crypto developer"',
    '<%= config.bin %> <%= command.id %> vitalik --json',
    '<%= config.bin %> <%= command.id %> web3 --limit 5',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 10,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserSearch);

    if (flags.limit < 1 || flags.limit > 100) {
      this.error('limit must be between 1 and 100', { exit: 2 });
    }

    try {
      const response = await this.withSpinner('Searching users', () =>
        this.client.searchUsers(args.query, flags.limit)
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatSearchResults(response.values));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
