import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { chmodSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import {
  deleteCredential,
  getCredentialsPath,
  getStoredCredential,
  type StoredCredential,
  saveCredential,
} from '../../../src/lib/config/credentials.js';
import { useTempHome } from '../../helpers/auth.js';

const PROD = 'https://api.ethos.network';
const DEV = 'https://api.dev.ethos.network';
// Mode bits are POSIX only.
const posixTest = test.skipIf(process.platform === 'win32');

function credential(token: string): StoredCredential {
  return { address: '0xabc', expiresAt: '2027-02-01T00:00:00.000Z', id: 1, profileId: 42, scopes: ['read'], token };
}

describe('credentials store', () => {
  let temp: ReturnType<typeof useTempHome>;

  beforeEach(() => {
    temp = useTempHome();
  });

  afterEach(() => {
    temp.cleanup();
  });

  posixTest('writes credentials.json beside config.json with mode 0600 in a 0700 directory', () => {
    saveCredential(PROD, credential('prod-key'));

    const path = getCredentialsPath();
    expect(path).toBe(`${temp.home}/.config/ethos/credentials.json`);
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(statSync(dirname(path)).mode & 0o777).toBe(0o700);
  });

  posixTest('tightens the mode of a file that already existed', () => {
    saveCredential(PROD, credential('prod-key'));
    chmodSync(getCredentialsPath(), 0o644);

    saveCredential(PROD, credential('new-key'));

    expect(statSync(getCredentialsPath()).mode & 0o777).toBe(0o600);
  });

  test('keeps a key per API URL, ignoring a trailing slash', () => {
    saveCredential(PROD, credential('prod-key'));
    saveCredential(DEV, credential('dev-key'));

    expect(getStoredCredential(`${PROD}/`)?.token).toBe('prod-key');
    expect(getStoredCredential(DEV)?.token).toBe('dev-key');
    expect(Object.keys(JSON.parse(readFileSync(getCredentialsPath(), 'utf8')))).toEqual([PROD, DEV]);
  });

  test('deleting one API leaves the others, and the last delete removes the file', () => {
    saveCredential(PROD, credential('prod-key'));
    saveCredential(DEV, credential('dev-key'));

    deleteCredential(PROD);
    expect(getStoredCredential(PROD)).toBeUndefined();
    expect(getStoredCredential(DEV)?.token).toBe('dev-key');

    deleteCredential(DEV);
    expect(existsSync(getCredentialsPath())).toBe(false);
  });

  test('leaves no temporary file beside credentials.json', () => {
    saveCredential(PROD, credential('prod-key'));
    saveCredential(DEV, credential('dev-key'));

    expect(readdirSync(dirname(getCredentialsPath()))).toEqual(['credentials.json']);
  });

  test('treats a corrupt file as empty', () => {
    saveCredential(PROD, credential('prod-key'));
    writeFileSync(getCredentialsPath(), 'not json');

    expect(getStoredCredential(PROD)).toBeUndefined();
  });
});
