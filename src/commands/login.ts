import { Flags } from '@oclif/core';
import { execFile } from 'node:child_process';
import { hostname as osHostname } from 'node:os';
import pc from 'picocolors';

import { createSession, type PollResult, pollSession } from '../lib/api/auth-client.js';
import { BaseCommand } from '../lib/base-command.js';
import { addAccount, sanitizeAccountName } from '../lib/config/credentials.js';
import { getWebUrl, loadConfig } from '../lib/config/index.js';
import { output } from '../lib/formatting/output.js';

const POLL_INTERVAL_MS = 2000;

// Browser opening is best-effort — the URL is also printed for manual use.
const ignoreOpenFailure = (): void => {};

function openBrowser(url: string): void {
  // execFile (no shell) so the URL is never interpolated into a command line.
  if (process.platform === 'darwin') {
    execFile('open', [url], ignoreOpenFailure);
  } else if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', url], ignoreOpenFailure);
  } else {
    execFile('xdg-open', [url], ignoreOpenFailure);
  }
}

export default class Login extends BaseCommand {
  static description = 'Sign in to Ethos from this device';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --account work',
    '<%= config.bin %> <%= command.id %> --no-browser',
    '<%= config.bin %> <%= command.id %> --json',
  ];
  static flags = {
    ...BaseCommand.baseFlags,
    browser: Flags.boolean({
      allowNo: true,
      default: true,
      description: 'Open the sign-in page in your browser automatically',
    }),
    timeout: Flags.integer({
      default: 600,
      description: 'Seconds to wait for sign-in before giving up',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Login);
    const config = loadConfig();

    try {
      const session = await this.withSpinner('Starting sign-in', () =>
        createSession(config.apiUrl, osHostname()),
      );

      const authUrl = `${getWebUrl()}/cli-auth?session=${encodeURIComponent(session.sessionId)}`;

      if (flags.browser) {
        openBrowser(authUrl);
      }

      if (!flags.json) {
        this.log(`${pc.dim('Open this URL to sign in:')} ${pc.cyan(authUrl)}`);
        this.log(pc.dim('Waiting for you to approve in the browser...'));
      }

      const result = await this.waitForCompletion(config.apiUrl, session.sessionId, flags.timeout);

      if (result.status === 'expired') {
        throw new Error('Sign-in session expired. Run: ethos login');
      }

      const accountName = flags.account ?? sanitizeAccountName(result.user.username);

      addAccount(accountName, {
        apiKey: result.apiKey,
        apiUrl: config.apiUrl,
        user: result.user,
      });

      if (flags.json) {
        this.log(output({ account: accountName, status: 'success', user: result.user }));
      } else {
        const profileSuffix = result.user.profileId ? ` (profile ${result.user.profileId})` : '';
        this.log(
          pc.green(
            `Signed in as ${result.user.displayName}${profileSuffix} (account: ${accountName})`,
          ),
        );
      }
    } catch (error) {
      this.handleError(error, flags.verbose);
    }
  }

  private async waitForCompletion(
    apiUrl: string,
    sessionId: string,
    timeoutSeconds: number,
  ): Promise<Extract<PollResult, { status: 'complete' | 'expired' }>> {
    const deadline = Date.now() + timeoutSeconds * 1000;

    while (Date.now() < deadline) {
      // eslint-disable-next-line no-await-in-loop -- polling is inherently sequential
      const result = await pollSession(apiUrl, sessionId);

      if (result.status === 'complete' || result.status === 'expired') {
        return result;
      }

      // eslint-disable-next-line no-await-in-loop -- polling is inherently sequential
      await new Promise((resolve) => {
        setTimeout(resolve, POLL_INTERVAL_MS);
      });
    }

    throw new Error(
      `Timed out waiting for sign-in after ${timeoutSeconds} seconds. Run: ethos login`,
    );
  }
}
