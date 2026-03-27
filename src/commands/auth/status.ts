import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';

import { getApiKey, loadAuthConfig } from '../../lib/auth/config.js';
import { output } from '../../lib/formatting/output.js';

export default class AuthStatus extends Command {
  static description = 'Show current authentication status';

  static examples = [
    '<%= config.bin %> auth status',
    '<%= config.bin %> auth status --json',
  ];

  static flags = {
    json: Flags.boolean({
      char: 'j',
      default: false,
      description: 'Output as JSON',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus);
    const config = loadAuthConfig();
    const envKey = process.env.ETHOS_API_KEY;

    if (flags.json) {
      this.log(output({
        authenticated: Boolean(getApiKey()),
        source: envKey ? 'env' : config ? 'config' : null,
        user: config?.user || null,
      }));
      return;
    }

    if (envKey) {
      this.log(`${pc.green('✓')} Authenticated via ${pc.bold('ETHOS_API_KEY')} environment variable`);
      if (config?.user) {
        this.logUserInfo(config.user);
      }

      return;
    }

    if (!config) {
      this.log('Not logged in. Run `ethos auth login` to authenticate.');
      return;
    }

    const identity = config.user.username
      ? `@${config.user.username}`
      : config.user.displayName;
    this.log(`${pc.green('✓')} Signed in as ${pc.bold(identity)}`);
    this.logUserInfo(config.user);

    if (config.createdAt) {
      this.log(`${pc.dim('Authenticated:')} ${new Date(config.createdAt).toLocaleDateString()}`);
    }
  }

  private logUserInfo(user: { displayName: string; primaryAddress: string; profileId: number | null; username: string | null }): void {
    this.log('');
    this.log(`${pc.dim('Display Name:')} ${user.displayName}`);
    if (user.username) {
      this.log(`${pc.dim('Username:')} @${user.username}`);
    }

    if (user.profileId) {
      this.log(`${pc.dim('Profile ID:')} ${user.profileId}`);
    }

    this.log(`${pc.dim('Address:')} ${user.primaryAddress}`);
  }
}
