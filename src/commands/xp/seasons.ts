import { BaseCommand } from '../../lib/base-command.js';
import { formatSeasons, output } from '../../lib/formatting/output.js';

export default class XpSeasons extends BaseCommand {
  static description = 'List all XP seasons';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(XpSeasons);

    try {
      const response = await this.withSpinner('Fetching seasons', () =>
        this.client.getSeasons()
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatSeasons(response.seasons, response.currentSeason));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
