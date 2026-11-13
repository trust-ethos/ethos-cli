import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';

import { runLogin } from '../../../src/lib/auth/login.js';
import { getCredentialsPath, getStoredCredential, saveCredential } from '../../../src/lib/config/credentials.js';
import { API_URL, type FetchCall, keyInfo, mockFetch, useTempHome } from '../../helpers/auth.js';

function loginOptions(overrides: Partial<Parameters<typeof runLogin>[0]> = {}) {
  const logs: string[] = [];
  return {
    logs,
    options: {
      apiUrl: API_URL,
      hostname: 'laptop',
      log: (message: string) => logs.push(message),
      noBrowser: false,
      timeoutSeconds: 5,
      ...overrides,
    },
  };
}

function urlState(url: string): { port: string; state: string } {
  const params = new URL(url).searchParams;
  return { port: params.get('port') ?? '', state: params.get('state') ?? '' };
}

/** Plays the web page: posts the form to the CLI's listener. */
function browserThatSigns(token: string) {
  const opened: string[] = [];
  const openUrl = async (url: string) => {
    opened.push(url);
    const { port, state } = urlState(url);
    setTimeout(() => {
      void fetch(`http://127.0.0.1:${port}/callback`, { body: new URLSearchParams({ state, token }), method: 'POST' });
    }, 10);
    return true;
  };

  return { opened, openUrl };
}

describe('login', () => {
  let temp: ReturnType<typeof useTempHome>;
  let api: ReturnType<typeof mockFetch>;

  const meHandler = (call: FetchCall) => {
    const key = call.headers['X-Ethos-Api-Key'];
    if (key === 'bad-key') return { body: { message: 'Invalid API key' }, status: 401 };
    if (call.method === 'DELETE') return { body: { ok: true }, status: 200 };
    return { body: keyInfo, status: 200 };
  };

  beforeEach(() => {
    temp = useTempHome();
    api = mockFetch(meHandler);
  });

  afterEach(() => {
    api.restore();
    temp.cleanup();
  });

  test('signs in through the browser and stores the verified key', async () => {
    const browser = browserThatSigns('new-key');
    const { logs, options } = loginOptions({ openUrl: browser.openUrl });

    await runLogin(options);

    const url = new URL(browser.opened[0]);
    expect(url.origin + url.pathname).toBe('https://app.ethos.network/cli/login');
    expect(url.searchParams.get('host')).toBe('laptop');
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{64}$/);
    expect(logs.join('\n')).toContain(browser.opened[0]);
    expect(logs.at(-1)).toBe(
      `Signed in as profile 42 (${keyInfo.address}), scopes read, expires 2027-02-01`,
    );
    expect(getStoredCredential(API_URL)).toEqual({
      address: keyInfo.address,
      expiresAt: keyInfo.expiresAt,
      id: 7,
      profileId: 42,
      scopes: ['read'],
      token: 'new-key',
    });
    expect(api.calls).toHaveLength(1);
    expect(api.calls[0].url).toBe(`${API_URL}/api/v2/api-keys/me`);
  });

  test('prints the URL when the browser cannot be opened', async () => {
    const browser = browserThatSigns('new-key');
    const { logs, options } = loginOptions({
      openUrl: async (url) => {
        await browser.openUrl(url);
        return false;
      },
    });

    await runLogin(options);

    expect(logs.join('\n')).toContain('Couldn’t open your browser');
    expect(logs.join('\n')).toContain(browser.opened[0]);
  });

  test('--no-browser prints the URL without a port and reads the key from the prompt', async () => {
    const { logs, options } = loginOptions({ noBrowser: true, promptKey: async () => ' pasted-key \n' });

    await runLogin(options);

    expect(logs[0]).toContain('https://app.ethos.network/cli/login?host=laptop');
    expect(logs[0]).not.toContain('port=');
    expect(getStoredCredential(API_URL)?.token).toBe('pasted-key');
    expect(api.calls[0].headers['X-Ethos-Api-Key']).toBe('pasted-key');
  });

  test('saves nothing and fails when the key does not verify', async () => {
    const { options } = loginOptions({ noBrowser: true, promptKey: async () => 'bad-key' });

    await expect(runLogin(options)).rejects.toThrow('isn’t valid');

    expect(existsSync(getCredentialsPath())).toBe(false);
  });

  test('keeps the old key and revokes nothing when the new key does not verify', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'old-key' });
    const { options } = loginOptions({ noBrowser: true, promptKey: async () => 'bad-key' });

    await expect(runLogin(options)).rejects.toThrow();

    expect(getStoredCredential(API_URL)?.token).toBe('old-key');
    expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
  });

  test('replaces a stored key and revokes the old one after the new one verified', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'old-key' });
    const { options } = loginOptions({ noBrowser: true, promptKey: async () => 'new-key' });

    await runLogin(options);

    expect(getStoredCredential(API_URL)?.token).toBe('new-key');
    expect(api.calls.map((call) => [call.method, call.headers['X-Ethos-Api-Key']])).toEqual([
      ['GET', 'new-key'],
      ['DELETE', 'old-key'],
    ]);
  });

  test('ignores a 401 when revoking the old key', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'bad-key' });
    const { logs, options } = loginOptions({ noBrowser: true, promptKey: async () => 'new-key' });

    await runLogin(options);

    expect(getStoredCredential(API_URL)?.token).toBe('new-key');
    expect(logs.at(-1)).toContain('Signed in as profile 42');
  });

  test('does not revoke the key when the same key is entered again', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'same-key' });
    const { options } = loginOptions({ noBrowser: true, promptKey: async () => 'same-key' });

    await runLogin(options);

    expect(api.calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
  });

  test('times out when the browser never answers', async () => {
    const { options } = loginOptions({ openUrl: async () => true, timeoutSeconds: 0.05 });

    await expect(runLogin(options)).rejects.toThrow('Timed out');
    expect(existsSync(getCredentialsPath())).toBe(false);
  });
});
