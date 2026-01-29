import { Args, Command, Flags } from '@oclif/core';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { formatScore, output } from '../../lib/formatting/output.js';

export default class ScoreLookup extends Command {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Look up reputation score for a user';

  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> vitalik.eth',
    '<%= config.bin %> <%= command.id %> 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    '<%= config.bin %> <%= command.id %> 0xNowater --json',
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
    breakdown: Flags.boolean({
      char: 'b',
      description: 'Show full score breakdown',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ScoreLookup);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);
      const score = user.score;
      const level = client.convertScoreToLevel(score);

      if (flags.breakdown) {
        const userkey = client.getPrimaryUserkey(user);
        if (userkey) {
          const breakdown = await client.getScoreBreakdownByUserkey(userkey);
          if (flags.json) {
            this.log(output({ score, level, breakdown: breakdown.data, identifier: args.identifier }));
          } else {
            this.log(formatScore({ score, level, identifier: args.identifier }));
            this.log('');
            this.log(formatScoreBreakdown(breakdown.data.elements));
          }
          return;
        }
      }

      if (flags.json) {
        this.log(output({ score, level, identifier: args.identifier }));
      } else {
        this.log(formatScore({ score, level, identifier: args.identifier }));
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}

function formatScoreBreakdown(elements: Record<string, { raw: number; weighted: number }>): string {
  const lines = ['Score Breakdown:', ''];
  const sortedElements = Object.entries(elements)
    .filter(([, e]) => e.weighted !== 0)
    .sort((a, b) => b[1].weighted - a[1].weighted);

  for (const [name, elem] of sortedElements) {
    const sign = elem.weighted >= 0 ? '+' : '';
    lines.push(`  ${sign}${elem.weighted} ${name}`);
  }

  if (sortedElements.length === 0) {
    lines.push('  No contributing factors');
  }

  return lines.join('\n');
}
