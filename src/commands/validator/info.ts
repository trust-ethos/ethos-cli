import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatValidator, output } from '../../lib/formatting/output.js';

export default class ValidatorInfo extends Command {
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
    const { args, flags } = await this.parse(ValidatorInfo);
    const client = new EchoClient();

    try {
      const validator = await client.getValidatorByTokenId(args.tokenId);

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
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}
