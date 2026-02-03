import { BaseCommand } from '../../lib/base-command.js';
import { formatFeaturedMarkets, output } from '../../lib/formatting/output.js';

export default class MarketFeatured extends BaseCommand {
  static description = 'Show top gainers and losers';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];
static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(MarketFeatured);

    try {
      const response = await this.withSpinner('Fetching featured markets', () =>
        this.client.getFeaturedMarkets()
      );

      if (flags.json) {
        this.log(output(response));
      } else {
        this.log(formatFeaturedMarkets(response));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
