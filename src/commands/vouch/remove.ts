import { confirm } from '@inquirer/prompts';
import { Args, Flags } from '@oclif/core';
import pc from 'picocolors';

import { BaseCommand } from '../../lib/base-command.js';
import { output } from '../../lib/formatting/output.js';
import { resolveVouchTarget } from './create.js';

export default class VouchRemove extends BaseCommand {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, ENS name, or profile ID to unvouch',
      required: true,
    }),
  };
  static description =
    'Release your vouch for a user, reclaiming the staked credits (no-op when you have no active vouch)';
  static examples = [
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> vitalik.eth --yes',
    '<%= config.bin %> <%= command.id %> profileId:42 --unhealthy --yes',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    unhealthy: Flags.boolean({
      default: false,
      description: 'Mark the relationship unhealthy while unvouching',
    }),
    yes: Flags.boolean({ char: 'y', default: false, description: 'Skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(VouchRemove);

    try {
      const target = await this.withSpinner('Resolving target', () =>
        resolveVouchTarget(args.identifier, this.client),
      );

      const { vouchId } = await this.withSpinner('Looking up your vouch', () =>
        this.client.activeVouchV2(target),
      );

      if (vouchId === null) {
        this.log(
          flags.json
            ? output({ removed: false, vouchId: null })
            : pc.dim(`No active vouch for ${args.identifier} — nothing to release.`),
        );
        return;
      }

      if (!flags.yes && !flags.json) {
        const confirmed = await confirm({
          message: `Release your vouch for ${args.identifier} and reclaim the staked credits?`,
        });

        if (!confirmed) {
          this.log(pc.dim('Cancelled.'));
          return;
        }
      }

      const result = await this.withSpinner('Releasing vouch', () =>
        this.client.unvouchV2({
          isHealthy: !flags.unhealthy,
          vouchId,
          waitForTxTimeoutSeconds: 30,
        }),
      );

      if (flags.json) {
        this.log(output({ removed: true, ...result }));
      } else {
        this.log(pc.green(`Vouch released. Transaction: ${result.hash}`));
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }
}
