import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatSearchResults, output } from '../../lib/formatting/output.js';

export default class UserSearch extends Command {
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
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Maximum number of results',
      default: 10,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed error information',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserSearch);
    const client = new EchoClient();

    try {
      const response = await client.searchUsers(args.query, flags.limit);

      if (flags.json) {
        this.log(output(response, flags));
      } else {
        this.log(formatSearchResults(response.values));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
      throw error;
    }
  }
}
