import { describe, expect, test } from 'bun:test';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  ETHOS_HOME,
  MANAGED_SUBPATHS,
  assertAllowedInstallPath,
  isAllowedInstallPath,
  listManagedRoots,
} from '../../src/lib/install-root.js';

describe('install-root contract', () => {
  test('ETHOS_HOME is ~/.ethos', () => {
    expect(ETHOS_HOME).toBe(join(homedir(), '.ethos'));
  });

  test('MANAGED_SUBPATHS pins the exact contract', () => {
    // Regression guard: changing this list is a contract change.
    // Update docs/filesystem-layout.md AND this assertion together.
    expect([...MANAGED_SUBPATHS]).toEqual(['current', 'bin', 'versions', 'updates', 'cache']);
  });

  test('listManagedRoots returns absolute paths under ETHOS_HOME', () => {
    expect(listManagedRoots()).toEqual([
      join(ETHOS_HOME, 'current'),
      join(ETHOS_HOME, 'bin'),
      join(ETHOS_HOME, 'versions'),
      join(ETHOS_HOME, 'updates'),
      join(ETHOS_HOME, 'cache'),
    ]);
  });
});

describe('isAllowedInstallPath', () => {
  test('accepts ETHOS_HOME itself', () => {
    expect(isAllowedInstallPath(ETHOS_HOME)).toBe(true);
  });

  test.each(MANAGED_SUBPATHS)('accepts managed sub-path: %s', (sub) => {
    expect(isAllowedInstallPath(join(ETHOS_HOME, sub))).toBe(true);
    expect(isAllowedInstallPath(join(ETHOS_HOME, sub, 'foo'))).toBe(true);
    expect(isAllowedInstallPath(join(ETHOS_HOME, sub, 'a', 'b', 'c'))).toBe(true);
  });

  test('rejects user state outside the contract', () => {
    // These are the paths ethosdev (and any future tooling) might add.
    // Refusing them is the whole point of the contract.
    expect(isAllowedInstallPath(join(ETHOS_HOME, '.wallets.json'))).toBe(false);
    expect(isAllowedInstallPath(join(ETHOS_HOME, 'ethos.env'))).toBe(false);
    expect(isAllowedInstallPath(join(ETHOS_HOME, 'config'))).toBe(false);
    expect(isAllowedInstallPath(join(ETHOS_HOME, 'wallets'))).toBe(false);
  });

  test('rejects paths outside ~/.ethos/ entirely', () => {
    expect(isAllowedInstallPath('/etc/passwd')).toBe(false);
    expect(isAllowedInstallPath('/tmp')).toBe(false);
    expect(isAllowedInstallPath(homedir())).toBe(false);
    expect(isAllowedInstallPath(join(homedir(), '.config'))).toBe(false);
  });

  test('rejects path-traversal attempts that escape the install root', () => {
    expect(isAllowedInstallPath(join(ETHOS_HOME, 'versions', '..', '..', 'tmp'))).toBe(false);
    expect(isAllowedInstallPath(join(ETHOS_HOME, 'bin', '..', '..', '.ssh'))).toBe(false);
  });

  test('accepts traversal that lands BACK inside the contract', () => {
    // versions/foo/../bar resolves to versions/bar — still allowed.
    expect(isAllowedInstallPath(join(ETHOS_HOME, 'versions', 'foo', '..', 'bar'))).toBe(true);
  });
});

describe('assertAllowedInstallPath', () => {
  test('returns silently for allowed paths', () => {
    expect(() =>
      assertAllowedInstallPath(join(ETHOS_HOME, 'versions', 'v1.0.0'), 'remove'),
    ).not.toThrow();
  });

  test('throws with op + offending path for disallowed paths', () => {
    expect(() => assertAllowedInstallPath(join(ETHOS_HOME, '.wallets.json'), 'remove')).toThrow(
      /Refusing to remove/,
    );
  });

  test('error message names the contract for reviewer signal', () => {
    try {
      assertAllowedInstallPath('/etc/passwd', 'wipe');
      expect.unreachable();
    } catch (err) {
      expect((err as Error).message).toContain('install contract');
      expect((err as Error).message).toContain('current, bin, versions, updates, cache');
      expect((err as Error).message).toContain('docs/filesystem-layout.md');
    }
  });
});
