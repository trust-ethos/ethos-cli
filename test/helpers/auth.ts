import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Command } from '@oclif/core';
import { spyOn } from 'bun:test';

import type { ApiKeyInfo } from '../../src/lib/api/echo-client.js';

export const API_URL = 'https://api.ethos.network';

export const keyInfo: ApiKeyInfo = {
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  createdAt: '2026-11-01T00:00:00.000Z',
  expiresAt: '2027-02-01T00:00:00.000Z',
  id: 7,
  lastUsedAt: null,
  name: 'ethos-cli on laptop',
  profileId: 42,
  scopes: ['read'],
};

export interface FetchCall {
  headers: Record<string, string>;
  method: string;
  url: string;
}

export type FetchHandler = (call: FetchCall) => { body?: unknown; status: number };

/** Points the config directory (ETHOS_CONFIG_DIR) at an empty temp dir so credentials and config never touch the real ones. */
export function useTempHome(): { cleanup(): void; home: string } {
  const home = mkdtempSync(join(tmpdir(), 'ethos-cli-test-'));
  const previous = { ETHOS_API_KEY: process.env.ETHOS_API_KEY, ETHOS_CONFIG_DIR: process.env.ETHOS_CONFIG_DIR, ETHOS_SKIP_UPDATE_CHECK: process.env.ETHOS_SKIP_UPDATE_CHECK };
  process.env.ETHOS_CONFIG_DIR = join(home, '.config', 'ethos');
  delete process.env.ETHOS_API_KEY;
  // The init hook would otherwise call GitHub for the update check.
  process.env.ETHOS_SKIP_UPDATE_CHECK = '1';

  return {
    cleanup() {
      restoreEnv('ETHOS_CONFIG_DIR', previous.ETHOS_CONFIG_DIR);
      restoreEnv('ETHOS_API_KEY', previous.ETHOS_API_KEY);
      restoreEnv('ETHOS_SKIP_UPDATE_CHECK', previous.ETHOS_SKIP_UPDATE_CHECK);
      rmSync(home, { force: true, recursive: true });
    },
    home,
  };
}

/** Replaces globalThis.fetch. Requests to 127.0.0.1 still reach the real one, for the callback server. */
export function mockFetch(handler: FetchHandler): { calls: FetchCall[]; restore(): void } {
  const realFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (input: Request | string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('http://127.0.0.1')) return realFetch(input, init);

    const call: FetchCall = {
      headers: Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>)),
      method: init?.method ?? 'GET',
      url,
    };
    calls.push(call);

    const { body, status } = handler(call);
    return new Response(JSON.stringify(body ?? {}), { headers: { 'Content-Type': 'application/json' }, status });
  }) as typeof fetch;

  return {
    calls,
    restore() {
      globalThis.fetch = realFetch;
    },
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

/** Collects what a command prints with this.log. runCommand's stdout capture doesn't work under Bun. */
export function captureLog(): { lines: string[]; restore(): void; text(): string } {
  const lines: string[] = [];
  const spy = spyOn(Command.prototype, 'log').mockImplementation((message?: string) => {
    lines.push(message ?? '');
  });

  return {
    lines,
    restore: () => spy.mockRestore(),
    text: () => lines.join('\n'),
  };
}
