import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import pc from 'picocolors';

import {
  type EchoClient,
  type ReviewScore,
  type ReviewSubject,
} from '../../lib/api/echo-client.js';
import { BaseCommand } from '../../lib/base-command.js';
import { ValidationError } from '../../lib/errors/cli-error.js';
import { output } from '../../lib/formatting/output.js';
import { parseIdentifier } from '../../lib/validation/userkey.js';

export async function resolveReviewSubject(
  identifier: string,
  client: EchoClient,
): Promise<ReviewSubject> {
  const parsed = parseIdentifier(identifier);

  switch (parsed.type) {
    case 'address': {
      return { address: parsed.value };
    }

    case 'discord':
    case 'farcaster':
    case 'telegram': {
      return { account: parsed.value, service: parsed.type };
    }

    case 'ens':
    case 'profileId': {
      const user = await client.resolveUserFromParsed(parsed);
      const addressKey = user.userkeys?.find((uk) => uk.startsWith('address:'));

      if (!addressKey) {
        throw new ValidationError(`Could not find a wallet address for ${identifier}.`);
      }

      return { address: addressKey.slice('address:'.length) };
    }

    case 'twitter': {
      return { x: { username: parsed.value } };
    }

    default: {
      throw new ValidationError(`Could not determine how to reference ${identifier}.`);
    }
  }
}

export default class ReviewAdd extends BaseCommand {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, ENS name, or profile ID to review',
      required: true,
    }),
  };
  static description = 'Write a review for a user';
  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater --score positive --title "Great to work with"',
    '<%= config.bin %> <%= command.id %> vitalik.eth --score neutral --title "No strong opinion" --comment "..."',
    '<%= config.bin %> <%= command.id %> someuser --score negative --title "Avoid" --yes',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    comment: Flags.string({ char: 'c', description: 'Longer review comment' }),
    score: Flags.string({
      description: 'Review sentiment',
      options: ['negative', 'neutral', 'positive'],
      required: true,
    }),
    title: Flags.string({ char: 't', description: 'Short review title', required: true }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewAdd);

    try {
      const subject = await this.withSpinner('Resolving subject', () =>
        resolveReviewSubject(args.identifier, this.client),
      );

      if (!flags.yes && !flags.json) {
        const confirmed = await confirm({
          message: `Post a ${flags.score} review of ${args.identifier}?`,
        });

        if (!confirmed) {
          this.log(pc.dim('Cancelled.'));
          return;
        }
      }

      const result = await this.withSpinner('Posting review', () =>
        this.client.addReview({
          content: flags.comment,
          score: flags.score as ReviewScore,
          subject,
          title: flags.title,
          waitForTxTimeoutSeconds: 30,
        }),
      );

      if (flags.json) {
        this.log(output(result));
      } else {
        this.log(pc.green(`Review posted. Transaction: ${result.hash}`));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
