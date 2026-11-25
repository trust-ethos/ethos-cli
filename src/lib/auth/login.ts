import { password } from '@inquirer/prompts';
import { randomBytes } from 'node:crypto';
import { hostname } from 'node:os';

import { type ApiKeyInfo, EchoClient, isRejectedApiKey } from '../api/echo-client.js';
import { getStoredCredential, normalizeApiUrl, saveCredential } from '../config/credentials.js';
import { CLIError } from '../errors/cli-error.js';
import { formatDate } from '../formatting/output.js';
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

/** Signs in, saves the key for this API, and returns what the API says about it. */
export async function runLogin(options: LoginOptions): Promise<ApiKeyInfo> {
  const apiUrl = normalizeApiUrl(options.apiUrl);
  const token = options.noBrowser ? await readKeyFromPrompt(apiUrl, options) : await readKeyFromBrowser(apiUrl, options);
  const client = new EchoClient({ apiUrl });

  let info;
  try {
    info = await client.getApiKeyMe(token);
  } catch (error) {
    if (isRejectedApiKey(error)) {
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
  if (process.env.ETHOS_API_KEY?.trim()) {
    options.log('ETHOS_API_KEY is set in your environment, and whoami and logout use it instead. Unset it to use this key.');
  }

  return info;
}

async function readKeyFromPrompt(apiUrl: string, options: LoginOptions): Promise<string> {
  const webUrl = findWebUrl(apiUrl);
  options.log(
    webUrl
      ? `Open this page, sign in, and copy the key it shows:\n${buildLoginUrl(webUrl, { host: options.hostname ?? hostname() })}\n`
      : `Paste an API key for ${apiUrl}.`,
  );

  const promptKey = options.promptKey ?? (() => password({ message: 'Paste the key' }));
  const token = (await promptKey()).trim();
  if (!token) {
    throw new CLIError('No key was entered.', 'NO_KEY', ['Run: ethos login --no-browser']);
  }

  return token;
}

/** The sign-in page's site, or undefined for an API with none: a pasted key works for any API. */
function findWebUrl(apiUrl: string): string | undefined {
  try {
    return getWebUrl(apiUrl);
  } catch (error) {
    if (error instanceof CLIError && error.code === 'UNKNOWN_WEB_URL') return undefined;
    throw error;
  }
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
