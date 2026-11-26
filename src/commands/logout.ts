import { Command, Flags } from '@oclif/core';

import { EchoClient, isRejectedApiKey } from '../lib/api/echo-client.js';
import { deleteCredential, getStoredCredential } from '../lib/config/credentials.js';
import { loadConfig } from '../lib/config/index.js';
import { formatError } from '../lib/formatting/error.js';
import { output } from '../lib/formatting/output.js';

/** `revoked`: the API revoked the key. `alreadyInvalid`: it had refused the key already. Both remove the local copy. */
type LogoutStatus = 'alreadyInvalid' | 'notSignedIn' | 'revoked';

const MESSAGES: Record<LogoutStatus, string> = {
  alreadyInvalid: 'Signed out. The key was already invalid, and it was removed from this machine.',
  notSignedIn: 'No key is stored on this machine, so there’s nothing to sign out of.',
  revoked: 'Signed out. The key was revoked and removed from this machine.',
};

export default class Logout extends Command {
  static description = 'Revoke the stored API key and remove it from this machine';
  static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];
  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Logout);
    const { apiUrl } = loadConfig();
    const envKeySet = Boolean(process.env.ETHOS_API_KEY?.trim());

    let status: LogoutStatus;
    try {
      status = await this.signOut(apiUrl);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      this.log(formatError(error, flags.verbose));
      this.log('The stored key was kept. Try again once the API answers.');
      this.exit(1);
    }

    if (flags.json) {
      this.log(output({ envKeySet, status }));
      return;
    }

    this.log(MESSAGES[status]);
    if (envKeySet) this.log('ETHOS_API_KEY is set in your environment, and logout leaves it as it is.');
  }

  /** Revokes the stored key, then removes it. Throws, keeping it, when the API can't be reached. */
  private async signOut(apiUrl: string): Promise<LogoutStatus> {
    const stored = getStoredCredential(apiUrl);
    if (!stored) return 'notSignedIn';

    let status: LogoutStatus = 'revoked';
    try {
      await new EchoClient({ apiUrl }).revokeApiKeyMe(stored.token);
    } catch (error) {
      if (!isRejectedApiKey(error)) throw error;
      status = 'alreadyInvalid';
    }

    deleteCredential(apiUrl, stored.token);
    return status;
  }
}
