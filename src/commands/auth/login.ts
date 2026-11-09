import { Command, ux } from '@oclif/core';
import { hostname } from 'node:os';

import { EchoClient } from '../../lib/api/echo-client.js';
import { loadAuthConfig, saveAuthConfig } from '../../lib/auth/config.js';
import { openUrl } from '../../lib/browser.js';

export default class AuthLogin extends Command {
  static description = 'Authenticate with Ethos via browser-based wallet signing';
static examples = [
    '<%= config.bin %> auth login',
  ];

  async run(): Promise<void> {
    const existing = loadAuthConfig();
    if (existing) {
      const identity = existing.user.username
        ? `@${existing.user.username}`
        : existing.user.displayName;
      this.log(`Already signed in as ${identity}. Run \`ethos auth logout\` first to sign in as a different user.`);
      return;
    }

    const client = new EchoClient();

    let session;
    try {
      session = await client.cliAuthCreateSession(hostname());
    } catch (error) {
      this.error(error instanceof Error ? error.message : 'Failed to create auth session', { exit: 1 });
    }

    const url = `https://app.ethos.network/cli-auth?session=${session.sessionId}`;
    this.log(`\nOpening ${url} in your browser...`);
    this.log('(No browser? Visit the URL manually.)\n');

    openUrl(url);

    const deadline = new Date(session.expiresAt).getTime();
    const showSpinner = Boolean(process.stdout.isTTY);

    if (showSpinner) {
      ux.action.start('Waiting for authentication');
    } else {
      this.log('Waiting for authentication...');
    }

    try {
      while (Date.now() < deadline) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(2000);
        // eslint-disable-next-line no-await-in-loop
        const result = await client.cliAuthPoll(session.sessionId);

        if (result.status === 'complete') {
          if (showSpinner) ux.action.stop();

          saveAuthConfig({
            apiKey: result.apiKey,
            createdAt: new Date().toISOString(),
            user: result.user,
          });

          const identity = result.user.username
            ? `@${result.user.username}`
            : result.user.displayName;
          this.log(`\n✓ Signed in as ${identity}`);
          this.log('  API key saved to ~/.ethos/config.json');
          return;
        }

        if (result.status === 'expired') {
          if (showSpinner) ux.action.stop('expired');
          this.error('Session expired. Run `ethos auth login` to try again.', { exit: 1 });
        }
      }

      if (showSpinner) ux.action.stop('timed out');
      this.error('Timed out waiting for browser authentication. Run `ethos auth login` to try again.', { exit: 1 });
    } catch (error) {
      if (showSpinner) ux.action.stop('failed');
      this.error(error instanceof Error ? error.message : 'Authentication failed', { exit: 1 });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
