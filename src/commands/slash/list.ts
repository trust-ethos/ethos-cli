import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatSlashes, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class SlashList extends Command {
  static description = 'List reputation slashes';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --status open',
    '<%= config.bin %> <%= command.id %> --subject twitter:0xNowater',
    '<%= config.bin %> <%= command.id %> --limit 5 --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
    status: Flags.string({
      description: 'Filter by status',
      options: ['open', 'closed'],
    }),
    author: Flags.string({ description: 'Filter by slasher userkey' }),
    subject: Flags.string({ description: 'Filter by subject userkey' }),
    limit: Flags.integer({ char: 'l', description: 'Max results', default: 10, min: 1, max: 100 }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SlashList);
    const client = new EchoClient();

    try {
      const response = await client.getSlashes({
        author: flags.author,
        subject: flags.subject,
        status: flags.status as any,
        limit: flags.limit,
      });

      if (flags.json) {
        this.log(output(response.data));
      } else {
        this.log(formatSlashes(response.data.values, response.data.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
