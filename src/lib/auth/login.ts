import { password } from '@inquirer/prompts';
import { randomBytes } from 'node:crypto';
import { hostname } from 'node:os';

import { EchoClient } from '../api/echo-client.js';
import { getStoredCredential, normalizeApiUrl, saveCredential } from '../config/credentials.js';
import { APIError, CLIError } from '../errors/cli-error.js';
import { startCallbackServer } from './callback-server.js';
import { openUrl } from './open-url.js';
import { buildLoginUrl, getWebUrl } from './web-url.js';

export interface LoginOptions {
  apiUrl: string;
  hostname?: string;
  log: (message: string) => void;
  noBrowser: boolean;
  openUrl?: (url: string) => Promise<boolean>;
  promptKey?: () => Promise<string>;
  timeoutSeconds: number;
}

export async function runLogin(options: LoginOptions): Promise<void> {
  const apiUrl = normalizeApiUrl(options.apiUrl);
  const token = options.noBrowser ? await readKeyFromPrompt(apiUrl, options) : await readKeyFromBrowser(apiUrl, options);
  const client = new EchoClient({ apiUrl });

  let info;
  try {
    info = await client.getApiKeyMe(token);
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 401) {
      throw new CLIError('That key isn’t valid, or it has expired or been revoked.', 'INVALID_KEY', [
        'Run: ethos login',
      ]);
    }

    throw error;
  }

  const previous = getStoredCredential(apiUrl);
  saveCredential(apiUrl, {
    address: info.address,
    expiresAt: info.expiresAt,
    id: info.id,
    profileId: info.profileId,
    scopes: info.scopes,
    token,
  });

  // Best effort: a profile has 25 key slots, so don’t leave the replaced key behind.
  if (previous && previous.token !== token) {
    await client.revokeApiKeyMe(previous.token).catch(() => {});
  }

  options.log(
    `Signed in as profile ${info.profileId} (${info.address}), scopes ${info.scopes.join(', ') || 'none'}, expires ${formatDate(info.expiresAt)}`,
  );
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toISOString().slice(0, 10);
}

async function readKeyFromPrompt(apiUrl: string, options: LoginOptions): Promise<string> {
  const url = buildLoginUrl(getWebUrl(apiUrl), { host: options.hostname ?? hostname() });
  options.log(`Open this page, sign in, and copy the key it shows:\n${url}\n`);

  const promptKey = options.promptKey ?? (() => password({ message: 'Paste the key' }));
  const token = (await promptKey()).trim();
  if (!token) {
    throw new CLIError('No key was entered.', 'NO_KEY', ['Run: ethos login --no-browser']);
  }

  return token;
}

async function readKeyFromBrowser(apiUrl: string, options: LoginOptions): Promise<string> {
  const webUrl = getWebUrl(apiUrl);
  const state = randomBytes(32).toString('hex');
  const server = await startCallbackServer(state);

  try {
    const url = buildLoginUrl(webUrl, { host: options.hostname ?? hostname(), port: server.port, state });
    const opened = await (options.openUrl ?? openUrl)(url);
    options.log(
      opened
        ? `Opening your browser. If it doesn’t open, visit:\n${url}\n`
        : `Couldn’t open your browser. Visit this page to sign in:\n${url}\n`,
    );
    options.log('Waiting for you to sign in...');

    return await server.waitForToken(options.timeoutSeconds * 1000);
  } finally {
    server.close();
  }
}
