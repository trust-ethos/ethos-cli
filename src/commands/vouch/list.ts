import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatVouches, output } from '../../lib/formatting/output.js';

export default class VouchList extends BaseCommand {
  static aliases = ['vl'];

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
    ...BaseCommand.baseFlags,
    author: Flags.string({
      description: 'Filter by author (Twitter username, ETH address, or ENS name)',
    }),
    active: Flags.boolean({
      description: 'Show only active (non-archived) vouches',
      default: false,
    }),
    limit: Flags.integer({
      char: 'l',
      description: 'Max results per request',
      default: 10,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Number of results to skip',
      default: 0,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchList);

    try {
      const params: { subjectUserkeys?: string[]; authorProfileIds?: number[]; archived?: boolean; limit?: number; offset?: number } = {
        limit: flags.limit,
        offset: flags.offset,
      };

      if (flags.active) {
        params.archived = false;
      }

      if (args.identifier) {
        const user = await this.withSpinner('Resolving user', () => this.client.resolveUser(args.identifier!));
        const userkey = this.client.getPrimaryUserkey(user);
        if (userkey) {
          params.subjectUserkeys = [userkey];
        }
      }

      if (flags.author) {
        const authorUser = await this.withSpinner('Resolving author', () => this.client.resolveUser(flags.author!));
        if (authorUser.profileId) {
          params.authorProfileIds = [authorUser.profileId];
        }
      }

      const response = await this.withSpinner('Fetching vouches', () => this.client.getVouches(params));

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatVouches(response.values, response.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
