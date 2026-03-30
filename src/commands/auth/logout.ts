import { Command } from '@oclif/core';

import { deleteAuthConfig, loadAuthConfig } from '../../lib/auth/config.js';

export default class AuthLogout extends Command {
  static description = 'Log out and remove stored API key';
static examples = [
    '<%= config.bin %> auth logout',
  ];

  async run(): Promise<void> {
    const config = loadAuthConfig();

    if (!config) {
      this.log('Not logged in.');
      return;
    }

    deleteAuthConfig();
    this.log('Logged out.');
  }
}
