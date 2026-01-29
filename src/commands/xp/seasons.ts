import { Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatSeasons, output } from '../../lib/formatting/output.js';

export default class XpSeasons extends Command {
  static description = 'List all XP seasons';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
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
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(XpSeasons);
    const client = new EchoClient();

    try {
      const response = await client.getSeasons() as any;
      const seasons = response.seasons || response;

      if (flags.json) {
        this.log(output(response, flags));
      } else {
        this.log(formatSeasons(Array.isArray(seasons) ? seasons : []));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
      throw error;
    }
  }
}
