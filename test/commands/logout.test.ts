import { runCommand } from '@oclif/test';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, rmSync } from 'node:fs';

import { getCredentialsPath, getStoredCredential, saveCredential } from '../../src/lib/config/credentials.js';
import { API_URL, captureLog, keyInfo, mockFetch, useTempHome } from '../helpers/auth.js';

const DEV_URL = 'https://api.dev.ethos.network';

describe('logout', () => {
  let temp: ReturnType<typeof useTempHome>;
  let api: ReturnType<typeof mockFetch>;
  let log: ReturnType<typeof captureLog>;
  let status: number;

  beforeEach(() => {
    temp = useTempHome();
    log = captureLog();
    status = 200;
    api = mockFetch(() => ({ body: status === 200 ? { ok: true } : { message: 'Unauthorized' }, status }));
    saveCredential(API_URL, { ...keyInfo, token: 'file-key' });
  });

  afterEach(() => {
    api.restore();
    log.restore();
    temp.cleanup();
  });

  test('revokes the key and removes the entry on 200', async () => {
    const { error } = await runCommand(['logout']);

    expect(error).toBeUndefined();
    expect(api.calls).toHaveLength(1);
    expect(api.calls[0]).toMatchObject({ method: 'DELETE', url: `${API_URL}/api/v2/api-keys/me` });
    expect(api.calls[0].headers['X-Ethos-Api-Key']).toBe('file-key');
    expect(getStoredCredential(API_URL)).toBeUndefined();
    expect(existsSync(getCredentialsPath())).toBe(false);
  });

  test('still removes the entry when the server answers 401', async () => {
    status = 401;

    const { error } = await runCommand(['logout']);

    expect(error).toBeUndefined();
    expect(log.text()).toContain('already invalid');
    expect(getStoredCredential(API_URL)).toBeUndefined();
  });

  test('leaves other APIs’ keys in the file', async () => {
    saveCredential(DEV_URL, { ...keyInfo, token: 'dev-key' });

    await runCommand(['logout']);

    expect(getStoredCredential(DEV_URL)?.token).toBe('dev-key');
  });

  test('keeps the entry on a 404, which an API without the route also answers', async () => {
    status = 404;

    const { error } = await runCommand(['logout']);

    expect(error?.oclif?.exit).toBe(1);
    expect(getStoredCredential(API_URL)?.token).toBe('file-key');
  });

  test('keeps the entry when the server cannot be reached', async () => {
    status = 500;

    const { error } = await runCommand(['logout']);

    expect(error?.oclif?.exit).toBe(1);
    expect(getStoredCredential(API_URL)?.token).toBe('file-key');
  });

  test('with only ETHOS_API_KEY set, says there is nothing stored and leaves the variable alone', async () => {
    api.calls.length = 0;
    const path = getCredentialsPath();
    await Bun.file(path).delete();
    process.env.ETHOS_API_KEY = 'env-key';

    const { error } = await runCommand(['logout']);

    expect(error).toBeUndefined();
    expect(log.text()).toContain('ETHOS_API_KEY');
    expect(process.env.ETHOS_API_KEY).toBe('env-key');
    expect(api.calls).toHaveLength(0);
  });

  test('--json reports a revoked key', async () => {
    const { error } = await runCommand(['logout', '--json']);

    expect(error).toBeUndefined();
    expect(JSON.parse(log.text())).toEqual({ envKeySet: false, status: 'revoked' });
  });

  test('--json reports a key the API had already refused', async () => {
    status = 401;

    await runCommand(['logout', '--json']);

    expect(JSON.parse(log.text())).toEqual({ envKeySet: false, status: 'alreadyInvalid' });
  });

  test('--json reports when nothing is stored', async () => {
    rmSync(getCredentialsPath());

    await runCommand(['logout', '--json']);

    expect(JSON.parse(log.text())).toEqual({ envKeySet: false, status: 'notSignedIn' });
    expect(api.calls).toHaveLength(0);
  });
});
