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
    status: Flags.string({
      description: 'Filter by status',
      options: ['open', 'closed'],
    }),
    author: Flags.string({ description: 'Filter by slasher userkey' }),
    subject: Flags.string({ description: 'Filter by subject userkey' }),
    limit: Flags.integer({ char: 'l', description: 'Max results per request', default: 10 }),
    offset: Flags.integer({ char: 'o', description: 'Number of results to skip', default: 0 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SlashList);

    try {
      const response = await this.withSpinner('Fetching slashes', () =>
        this.client.getSlashes({
          author: flags.author,
          subject: flags.subject,
          status: flags.status as any,
          limit: flags.limit,
          offset: flags.offset,
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
