import { runCommand } from '@oclif/test';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { getCredentialsPath, saveCredential } from '../../src/lib/config/credentials.js';
import { saveConfig } from '../../src/lib/config/index.js';
import { API_URL, captureLog, keyInfo, mockFetch, useTempHome } from '../helpers/auth.js';

describe('whoami', () => {
  let temp: ReturnType<typeof useTempHome>;
  let api: ReturnType<typeof mockFetch>;
  let log: ReturnType<typeof captureLog>;
  let meStatus: number;

  beforeEach(() => {
    temp = useTempHome();
    log = captureLog();
    meStatus = 200;
    api = mockFetch(() => ({ body: meStatus === 200 ? keyInfo : { message: 'Unauthorized' }, status: meStatus }));
  });

  afterEach(() => {
    api.restore();
    log.restore();
    temp.cleanup();
  });

  test('shows the profile for the stored key and where it came from', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });

    const { error } = await runCommand(['whoami']);

    expect(error).toBeUndefined();
    expect(log.text()).toContain('42');
    expect(log.text()).toContain(keyInfo.address);
    expect(log.text()).toContain('2027-02-01');
    expect(log.text()).toContain(getCredentialsPath());
    expect(api.calls[0].headers['X-Ethos-Api-Key']).toBe('file-key');
  });

  test('ETHOS_API_KEY overrides the stored key', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });
    process.env.ETHOS_API_KEY = 'env-key';

    await runCommand(['whoami', '--json']);

    expect(api.calls[0].headers['X-Ethos-Api-Key']).toBe('env-key');
    expect(JSON.parse(log.text())).toMatchObject({ profileId: 42, scopes: ['read'], source: 'env' });
  });

  test('works with only ETHOS_API_KEY set', async () => {
    process.env.ETHOS_API_KEY = 'env-key';

    const { error } = await runCommand(['whoami']);

    expect(error).toBeUndefined();
    expect(log.text()).toContain('env');
  });

  test('tells the person to log in when there is no key, and exits 1', async () => {
    const { error } = await runCommand(['whoami']);

    expect(log.text()).toContain('ethos login');
    expect(error?.oclif?.exit).toBe(1);
    expect(api.calls).toHaveLength(0);
  });

  test('tells the person to replace or unset ETHOS_API_KEY when that key is refused', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });
    process.env.ETHOS_API_KEY = 'env-key';
    meStatus = 401;

    const { error } = await runCommand(['whoami']);

    expect(log.text()).toContain('ETHOS_API_KEY');
    expect(log.text()).toContain('unset');
    expect(error?.oclif?.exit).toBe(1);
  });

  test('says the key is no longer valid on a 401', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });
    meStatus = 401;

    const { error } = await runCommand(['whoami']);

    expect(log.text()).toContain('no longer valid');
    expect(log.text()).toContain('ethos login');
    expect(error?.oclif?.exit).toBe(1);
  });

  test('does not call the key invalid on a 404, which an API without the route also answers', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });
    meStatus = 404;

    const { error } = await runCommand(['whoami']);

    expect(log.text()).not.toContain('no longer valid');
    expect(log.text()).toContain('/api/v2/api-keys/me');
    expect(log.text()).not.toContain('user search');
    expect(error?.oclif?.exit).toBe(1);
  });

  test('a trailing slash in the API URL still finds the key and calls one URL', async () => {
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });
    saveConfig({ apiUrl: `${API_URL}/` });

    const { error } = await runCommand(['whoami']);

    expect(error).toBeUndefined();
    expect(api.calls[0].url).toBe(`${API_URL}/api/v2/api-keys/me`);
  });
});
