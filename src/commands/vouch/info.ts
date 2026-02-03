import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatVouch, output } from '../../lib/formatting/output.js';

export default class VouchInfo extends BaseCommand {
  static aliases = ['vi'];

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
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchInfo);

    try {
      const response = await this.withSpinner('Fetching vouch', () => this.client.getVouches({ ids: [args.id], limit: 1 }));

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
      this.handleError(error, flags.verbose);
    }
  }
}
