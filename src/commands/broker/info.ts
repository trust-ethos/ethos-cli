import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatBrokerPost, output } from '../../lib/formatting/output.js';
import { formatError } from '../../lib/formatting/error.js';

export default class BrokerInfo extends Command {
  static description = 'Get details of a specific broker post';

  static args = {
    id: Args.integer({ description: 'Broker post ID', required: true }),
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
    const { args, flags } = await this.parse(BrokerInfo);
    const client = new EchoClient();

    try {
      const post = await client.getBrokerPost(args.id);

      if (flags.json) {
        this.log(output(post));
      } else {
        this.log(formatBrokerPost(post));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
