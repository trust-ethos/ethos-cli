import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatSlash, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class SlashInfo extends Command {
  static description = 'Get details of a specific slash';

  static args = {
    id: Args.integer({ description: 'Slash ID', required: true }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --json',
  ];

  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SlashInfo);
    const client = new EchoClient();

    try {
      // Get slashes filtered by ID (API doesn't have direct ID lookup, so filter)
      const response = await client.getSlashes({ limit: 100 });
      const slash = response.data.values.find((s: any) => s.id === args.id);

      if (!slash) {
        throw new Error(`Slash #${args.id} not found`);
      }

      if (flags.json) {
        this.log(output(slash));
      } else {
        this.log(formatSlash(slash));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
