import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';

import { type ApiKeyInfo, EchoClient } from '../lib/api/echo-client.js';
import { formatDate } from '../lib/auth/login.js';
import { resolveCredential } from '../lib/config/credentials.js';
import { loadConfig } from '../lib/config/index.js';
import { APIError } from '../lib/errors/cli-error.js';
import { formatError } from '../lib/formatting/error.js';
import { output } from '../lib/formatting/output.js';

export default class Whoami extends Command {
  static description = 'Show the profile and API key this CLI is signed in with';
static examples = ['<%= config.bin %> <%= command.id %>', '<%= config.bin %> <%= command.id %> --json'];
static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output as JSON' }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Whoami);
    const { apiUrl } = loadConfig();

    const resolved = resolveCredential(apiUrl);
    if (!resolved) {
      this.log('You’re not signed in. Run: ethos login');
      this.exit(1);
    }

    let info: ApiKeyInfo | undefined;
    let failure: Error | undefined;
    try {
      info = await new EchoClient({ apiUrl }).getApiKeyMe(resolved.credential.token);
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      failure = error;
    }

    if (failure instanceof APIError && failure.statusCode === 401) {
      this.log(`The key from ${resolved.source} is no longer valid. Run: ethos login`);
      this.exit(1);
    }

    if (failure || !info) {
      this.log(formatError(failure ?? new Error('No response from the API.'), flags.verbose));
      this.exit(1);
    }

    if (flags.json) {
      this.log(output({ ...info, source: resolved.source }));
      return;
    }

    this.log(`${pc.bold('Profile')}  ${info.profileId}`);
    this.log(`${pc.bold('Address')}  ${info.address}`);
    this.log(`${pc.bold('Scopes')}   ${info.scopes.join(', ') || 'none'}`);
    this.log(`${pc.bold('Expires')}  ${formatDate(info.expiresAt)}`);
    this.log(`${pc.bold('Source')}   ${resolved.source}`);
  }
}
