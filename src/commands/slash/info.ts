import { Args } from '@oclif/core';

import type { Slash } from '../../lib/api/echo-client.js';

import { BaseCommand } from '../../lib/base-command.js';
import { formatSlash, output } from '../../lib/formatting/output.js';

export default class SlashInfo extends BaseCommand {
  static args = {
    id: Args.integer({ description: 'Slash ID', required: true }),
  };
static description = 'Get details of a specific slash';
static examples = [
    '<%= config.bin %> <%= command.id %> 123',
    '<%= config.bin %> <%= command.id %> 123 --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SlashInfo);

    try {
      // Get slashes filtered by ID (API doesn't have direct ID lookup, so filter)
      const response = await this.withSpinner('Fetching slash', () =>
        this.client.getSlashes({ limit: 100 })
      );
      const slash = response.data.values.find((s: Slash) => s.id === args.id);

      if (!slash) {
        throw new Error(`Slash #${args.id} not found`);
      }

      if (flags.json) {
        this.log(output(slash));
      } else {
        this.log(formatSlash(slash));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
