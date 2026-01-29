import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatValidatorListings, output } from '../../lib/formatting/output.js';

export default class ValidatorSales extends Command {
  static description = 'List validator NFTs for sale on OpenSea';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
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
    const { flags } = await this.parse(ValidatorSales);
    const client = new EchoClient();

    try {
      const response = await client.getValidatorListings({ limit: flags.limit, offset: flags.offset });

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatValidatorListings(response.values, response.total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
