import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatValidators, output } from '../../lib/formatting/output.js';

export default class ValidatorList extends Command {
  static description = 'List all Ethos validator NFT owners';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --limit 20',
    '<%= config.bin %> <%= command.id %> --available',
    '<%= config.bin %> <%= command.id %> --json',
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
      description: 'Max results to display',
      default: 10,
    }),
    offset: Flags.integer({
      char: 'o',
      description: 'Number of results to skip',
      default: 0,
    }),
    available: Flags.boolean({
      char: 'a',
      description: 'Show only validators with remaining XP capacity',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ValidatorList);
    const client = new EchoClient();

    try {
      let validators = await client.getValidators();

      if (flags.available) {
        validators = validators.filter(v => !v.isFull);
      }

      const total = validators.length;
      validators = validators.slice(flags.offset, flags.offset + flags.limit);

      if (flags.json) {
        this.log(output({ values: validators, total, limit: flags.limit, offset: flags.offset }));
      } else {
        this.log(formatValidators(validators, total));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
