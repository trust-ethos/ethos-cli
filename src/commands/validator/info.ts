import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command.js';
import { formatValidator, output } from '../../lib/formatting/output.js';

export default class ValidatorInfo extends BaseCommand {
  static description = 'Get details of a specific validator NFT';

  static args = {
    tokenId: Args.string({
      description: 'Validator token ID',
      required: true,
    }),
  };

  static examples = [
    '<%= config.bin %> <%= command.id %> 1',
    '<%= config.bin %> <%= command.id %> 42 --json',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ValidatorInfo);

    try {
      const validator = await this.withSpinner('Fetching validator', () =>
        this.client.getValidatorByTokenId(args.tokenId)
      );

      if (!validator) {
        this.log(`Validator with token ID ${args.tokenId} not found.`);
        this.exit(1);
        return;
      }

      if (flags.json) {
        this.log(output(validator));
      } else {
        this.log(formatValidator(validator));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
