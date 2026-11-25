import { describe, expect, test } from 'bun:test';

import { startDetached } from '../../../src/lib/auth/open-url.js';

describe('startDetached', () => {
  test('resolves true while the launcher is still running', async () => {
    const started = Date.now();

    expect(await startDetached('sleep', ['5'])).toBe(true);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  test('resolves false when the launcher does not exist', async () => {
    expect(await startDetached('ethos-cli-no-such-launcher', [])).toBe(false);
  });
});
