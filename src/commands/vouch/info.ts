import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatVouch, output } from '../../lib/formatting/output.js';

export default class VouchInfo extends Command {
  static args = {
    id: Args.integer({
      description: 'Vouch ID',
      required: true,
    }),
  };

  static description = 'Get details of a specific vouch';

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --json',
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
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchInfo);
    const client = new EchoClient();

    try {
      const response = await client.getVouches({ ids: [args.id], limit: 1 });

      if (!response.values.length) {
        this.error(`Vouch #${args.id} not found`, { exit: 1 });
      }

      const vouch = response.values[0];

      if (flags.json) {
        this.log(output(vouch));
      } else {
        this.log(formatVouch(vouch));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
