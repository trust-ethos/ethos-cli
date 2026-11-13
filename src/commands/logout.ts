import { Command, Flags } from '@oclif/core';

import { EchoClient, isRejectedApiKey } from '../lib/api/echo-client.js';
import { deleteCredential, getStoredCredential } from '../lib/config/credentials.js';
import { loadConfig } from '../lib/config/index.js';
import { formatError } from '../lib/formatting/error.js';

export default class Logout extends Command {
  static description = 'Revoke the stored API key and remove it from this machine';
static examples = ['<%= config.bin %> <%= command.id %>'];
static flags = {
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Logout);
    const { apiUrl } = loadConfig();
    const stored = getStoredCredential(apiUrl);
    const envKeySet = Boolean(process.env.ETHOS_API_KEY?.trim());

    if (!stored) {
      this.log(
        envKeySet
          ? 'Nothing is stored to sign out of. ETHOS_API_KEY is set in your environment, and logout leaves it as it is.'
          : 'You’re not signed in, so there’s nothing to sign out of.',
      );
      return;
    }

    let failure: Error | undefined;
    let alreadyInvalid = false;
    try {
      await new EchoClient({ apiUrl }).revokeApiKeyMe(stored.token);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      // The key is already invalid, expired or revoked, so only the local copy is left to remove.
      if (isRejectedApiKey(error)) alreadyInvalid = true;
      else failure = error;
    }

    if (failure) {
      this.log(formatError(failure, flags.verbose));
      this.log('The stored key was kept. Try again when the API is reachable.');
      this.exit(1);
    }

    deleteCredential(apiUrl);
    this.log(
      alreadyInvalid
        ? 'Signed out. The key was already invalid, and it was removed from this machine.'
        : 'Signed out. The key was revoked and removed from this machine.',
    );
    if (envKeySet) this.log('ETHOS_API_KEY is still set in your environment.');
  }
}
