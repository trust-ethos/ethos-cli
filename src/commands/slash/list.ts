import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base-command.js';
import { formatSlashes, output } from '../../lib/formatting/output.js';

export default class SlashList extends BaseCommand {
  static description = 'List reputation slashes';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --status open',
    '<%= config.bin %> <%= command.id %> --subject twitter:0xNowater',
    '<%= config.bin %> <%= command.id %> --limit 5 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
    author: Flags.string({ description: 'Filter by slasher userkey' }),
    limit: Flags.integer({ char: 'l', default: 10, description: 'Max results per request' }),
    offset: Flags.integer({ char: 'o', default: 0, description: 'Number of results to skip' }),
    status: Flags.string({
      description: 'Filter by status',
      options: ['open', 'closed'],
    }),
    subject: Flags.string({ description: 'Filter by subject userkey' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SlashList);

    try {
      const response = await this.withSpinner('Fetching slashes', () =>
        this.client.getSlashes({
          author: flags.author,
          limit: flags.limit,
          offset: flags.offset,
          status: flags.status as 'closed' | 'open' | undefined,
          subject: flags.subject,
        })
      );

      if (flags.json) {
        this.log(output(response.data));
      } else {
        this.log(formatSlashes(response.data.values, response.data.total));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
