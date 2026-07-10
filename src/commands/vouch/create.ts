import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import pc from 'picocolors';

import { type EchoClient } from '../../lib/api/echo-client.js';
import { BaseCommand } from '../../lib/base-command.js';
import { ValidationError } from '../../lib/errors/cli-error.js';
import { creditsToWei } from '../../lib/formatting/amount.js';
import { output } from '../../lib/formatting/output.js';
import { parseIdentifier, toUserkey } from '../../lib/validation/userkey.js';

export async function resolveVouchTarget(identifier: string, client: EchoClient): Promise<string> {
  const parsed = parseIdentifier(identifier);

  // ENS names aren't a valid userkey on their own — resolve to the user first.
  if (parsed.type === 'ens') {
    const user = await client.resolveUserFromParsed(parsed);
    const userkey = client.getPrimaryUserkey(user);

    if (!userkey) {
      throw new ValidationError(`Could not resolve a userkey for ${identifier}.`);
    }

    return userkey;
  }

  return toUserkey(parsed);
}

export default class VouchCreate extends BaseCommand {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, ENS name, or profile ID to vouch for',
      required: true,
    }),
  };
  static description = 'Vouch for a user by staking credits on their reputation';
  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater --amount 10',
    '<%= config.bin %> <%= command.id %> vitalik.eth --amount 5.5 --yes',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    amount: Flags.string({ char: 'a', description: 'Amount of credits to stake', required: true }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchCreate);

    try {
      const amountWei = creditsToWei(flags.amount);
      const target = await this.withSpinner('Resolving target', () =>
        resolveVouchTarget(args.identifier, this.client),
      );

      if (!flags.yes && !flags.json) {
        const confirmed = await confirm({
          message: `Vouch for ${args.identifier} with ${flags.amount} credits?`,
        });

        if (!confirmed) {
          this.log(pc.dim('Cancelled.'));
          return;
        }
      }

      const result = await this.withSpinner('Submitting vouch', () =>
        this.client.vouchV2({ amount: amountWei, target, waitForTxTimeoutSeconds: 30 }),
      );

      if (flags.json) {
        this.log(output(result));
      } else {
        this.log(pc.green(`Vouch submitted. Transaction: ${result.hash}`));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
