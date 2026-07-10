import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  addAccount,
  type Account,
  clearAllAccounts,
  getAccount,
  getActiveAccount,
  getActiveApiKey,
  getCredentialsPath,
  getEffectiveApiUrl,
  listAccounts,
  removeAccount,
  setActiveAccount,
  setCredentialsPathForTesting,
  type StoredUser,
} from '../../../src/lib/config/credentials.js';
import { setConfigPathForTesting } from '../../../src/lib/config/index.js';

const devUser: StoredUser = {
  displayName: 'Dev User',
  primaryAddress: '0xDEV',
  profileId: 1,
  username: 'devuser',
};

const prodUser: StoredUser = {
  displayName: 'Prod User',
  primaryAddress: '0xPROD',
  profileId: 2,
  username: null,
};

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'ethos-cli-credentials-'));
  setCredentialsPathForTesting(join(tempDir, 'credentials.json'));
});

afterEach(() => {
  setCredentialsPathForTesting(null);
  rmSync(tempDir, { force: true, recursive: true });
});

describe('accounts', () => {
  test('listAccounts returns an empty array when no file exists', () => {
    expect(listAccounts()).toEqual([]);
  });

  test('addAccount creates an account and makes the first one active', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });

    expect(listAccounts()).toEqual([
      { active: true, apiUrl: 'http://localhost:4000', name: 'dev', user: devUser },
    ]);
    expect(getActiveAccount()?.name).toBe('dev');
  });

  test('addAccount does not change the active account when adding a second one', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    addAccount('prod', { apiKey: 'prod-key', apiUrl: 'https://api.ethos.network', user: prodUser });

    expect(getActiveAccount()?.name).toBe('dev');
    expect(
      listAccounts()
        .map((a) => a.name)
        .sort(),
    ).toEqual(['dev', 'prod']);
  });

  test('addAccount rejects invalid names', () => {
    expect(() =>
      addAccount('Not Valid!', { apiKey: 'k', apiUrl: 'http://localhost:4000', user: devUser }),
    ).toThrow(/Invalid account name/);
  });

  test('getAccount returns null for an unknown name', () => {
    expect(getAccount('missing')).toBeNull();
  });

  test('setActiveAccount switches the active account', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    addAccount('prod', { apiKey: 'prod-key', apiUrl: 'https://api.ethos.network', user: prodUser });

    setActiveAccount('prod');

    expect(getActiveAccount()?.name).toBe('prod');
    expect(listAccounts().find((a) => a.name === 'dev')?.active).toBe(false);
    expect(listAccounts().find((a) => a.name === 'prod')?.active).toBe(true);
  });

  test('setActiveAccount throws for an unknown name', () => {
    expect(() => setActiveAccount('missing')).toThrow(/No account named "missing"/);
  });

  test('removeAccount removes only the targeted account', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    addAccount('prod', { apiKey: 'prod-key', apiUrl: 'https://api.ethos.network', user: prodUser });

    removeAccount('dev');

    expect(getAccount('dev')).toBeNull();
    expect(getAccount('prod')).not.toBeNull();
  });

  test('removeAccount reassigns the active account when the active one is removed', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    addAccount('prod', { apiKey: 'prod-key', apiUrl: 'https://api.ethos.network', user: prodUser });

    removeAccount('dev');

    expect(getActiveAccount()?.name).toBe('prod');
  });

  test('removeAccount clears activeAccount when the last account is removed', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    removeAccount('dev');

    expect(getActiveAccount()).toBeNull();
  });

  test('removeAccount is a no-op for an unknown name', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    expect(() => removeAccount('missing')).not.toThrow();
    expect(getAccount('dev')).not.toBeNull();
  });

  test('clearAllAccounts wipes every account', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    addAccount('prod', { apiKey: 'prod-key', apiUrl: 'https://api.ethos.network', user: prodUser });

    clearAllAccounts();

    expect(listAccounts()).toEqual([]);
    expect(getActiveAccount()).toBeNull();
  });

  test('writes the credentials file with 0600 permissions', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    const mode = statSync(getCredentialsPath()).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  test('repairs permissions on a pre-existing file written with looser mode', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({ accounts: {}, activeAccount: null, version: 2 }),
      { mode: 0o644 },
    );
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    const mode = statSync(getCredentialsPath()).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  test('creates parent directories as needed', () => {
    const nestedPath = join(tempDir, 'nested', 'dir', 'credentials.json');
    setCredentialsPathForTesting(nestedPath);
    expect(() =>
      addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser }),
    ).not.toThrow();
    expect(getAccount('dev')).not.toBeNull();
  });

  test('falls back to an empty store on corrupt JSON', () => {
    writeFileSync(getCredentialsPath(), 'not json', 'utf8');
    expect(listAccounts()).toEqual([]);
  });
});

describe('v1 -> v2 migration', () => {
  test('converts a v1 file into a v2 account named from the username', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({
        credentials: {
          'http://localhost:4000': {
            apiKey: 'legacy-key',
            createdAt: '2026-07-01T00:00:00.000Z',
            user: devUser,
          },
        },
        version: 1,
      }),
    );

    const accounts = listAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toEqual({
      active: true,
      apiUrl: 'http://localhost:4000',
      name: 'devuser',
      user: devUser,
    });
    expect(getActiveAccount()?.apiKey).toBe('legacy-key');
  });

  test('lowercases and sanitizes usernames for the migrated account name', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({
        credentials: {
          'http://localhost:4000': {
            apiKey: 'legacy-key',
            createdAt: '2026-07-01T00:00:00.000Z',
            user: { ...devUser, username: '0xNoWater' },
          },
        },
        version: 1,
      }),
    );

    expect(getActiveAccount()?.name).toBe('0xnowater');
  });

  test('falls back to "default" when there is no username', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({
        credentials: {
          'https://api.ethos.network': {
            apiKey: 'legacy-key',
            createdAt: '2026-07-02T00:00:00.000Z',
            user: prodUser,
          },
        },
        version: 1,
      }),
    );

    expect(getActiveAccount()?.name).toBe('default');
  });

  test('de-dupes account names across multiple v1 entries', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({
        credentials: {
          'http://localhost:4000': {
            apiKey: 'dev-key',
            createdAt: '2026-07-01T00:00:00.000Z',
            user: devUser,
          },
          'https://api.dev.ethos.network': {
            apiKey: 'dev-key-2',
            createdAt: '2026-07-01T00:00:01.000Z',
            user: devUser,
          },
        },
        version: 1,
      }),
    );

    const names = listAccounts()
      .map((a) => a.name)
      .sort();
    expect(names).toEqual(['devuser', 'devuser-2']);
  });

  test('persists the migration back to disk as v2', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({
        credentials: {
          'http://localhost:4000': {
            apiKey: 'legacy-key',
            createdAt: '2026-07-01T00:00:00.000Z',
            user: devUser,
          },
        },
        version: 1,
      }),
    );

    listAccounts();

    const raw: { accounts: Record<string, Account>; version: number } = JSON.parse(
      readFileSync(getCredentialsPath(), 'utf8'),
    );
    expect(raw.version).toBe(2);
    expect(Object.keys(raw.accounts)).toEqual(['devuser']);
  });

  test('never loses the existing credential during migration', () => {
    writeFileSync(
      getCredentialsPath(),
      JSON.stringify({
        credentials: {
          'http://localhost:4000': {
            apiKey: 'legacy-key',
            createdAt: '2026-07-01T00:00:00.000Z',
            user: devUser,
          },
        },
        version: 1,
      }),
    );

    const account = getActiveAccount();
    expect(account?.apiKey).toBe('legacy-key');
    expect(account?.apiUrl).toBe('http://localhost:4000');
    expect(account?.user).toEqual(devUser);
  });
});

describe('getEffectiveApiUrl / getActiveApiKey', () => {
  beforeEach(() => {
    setConfigPathForTesting(join(tempDir, 'config.json'));
  });

  afterEach(() => {
    setConfigPathForTesting(null);
  });

  test('falls back to config.json apiUrl when there is no active account', () => {
    expect(getEffectiveApiUrl()).toBe('https://api.ethos.network');
    expect(getActiveApiKey()).toBeNull();
  });

  test('uses the active account apiUrl and key', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });

    expect(getEffectiveApiUrl()).toBe('http://localhost:4000');
    expect(getActiveApiKey()).toBe('dev-key');
  });

  test('an explicit override wins over the active account', () => {
    addAccount('dev', { apiKey: 'dev-key', apiUrl: 'http://localhost:4000', user: devUser });
    addAccount('prod', { apiKey: 'prod-key', apiUrl: 'https://api.ethos.network', user: prodUser });

    expect(getEffectiveApiUrl('prod')).toBe('https://api.ethos.network');
    expect(getActiveApiKey('prod')).toBe('prod-key');
  });

  test('throws clearly when the override names a missing account', () => {
    expect(() => getEffectiveApiUrl('missing')).toThrow(/No account named "missing"/);
    expect(() => getActiveApiKey('missing')).toThrow(/No account named "missing"/);
  });
});
