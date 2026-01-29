import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatVouches, output } from '../../lib/formatting/output.js';

export default class VouchList extends Command {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name (optional, filter by subject)',
      required: false,
    }),
  };

  static description = 'List vouches for a user or all vouches';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> --author 0xNowater',
    '<%= config.bin %> <%= command.id %> --active',
    '<%= config.bin %> <%= command.id %> --limit 20 --json',
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
    author: Flags.string({
      description: 'Filter by author (Twitter username, ETH address, or ENS name)',
    }),
    active: Flags.boolean({
      description: 'Show only active (non-archived) vouches',
      default: false,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Max results',
      default: 10,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchList);
    const client = new EchoClient();

    try {
      const params: { subjectUserkeys?: string[]; authorProfileIds?: number[]; archived?: boolean; limit?: number } = {
        limit: flags.limit,
      };

      if (flags.active) {
        params.archived = false;
      }

      if (args.identifier) {
        const user = await client.resolveUser(args.identifier);
        const userkey = client.getPrimaryUserkey(user);
        if (userkey) {
          params.subjectUserkeys = [userkey];
        }
      }

      if (flags.author) {
        const authorUser = await client.resolveUser(flags.author);
        if (authorUser.profileId) {
          params.authorProfileIds = [authorUser.profileId];
        }
      }

      const response = await client.getVouches(params);

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVouches(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
