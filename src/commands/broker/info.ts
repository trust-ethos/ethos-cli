import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatBrokerPost, output } from '../../lib/formatting/output.js';

export default class BrokerInfo extends BaseCommand {
  static description = 'Get details of a specific broker post';

  static args = {
    id: Args.integer({ description: 'Broker post ID', required: true }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BrokerInfo);

    try {
      const post = await this.withSpinner('Fetching broker post', () =>
        this.client.getBrokerPost(args.id)
      );

      if (flags.json) {
        this.log(output(post));
      } else {
        this.log(formatBrokerPost(post));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
