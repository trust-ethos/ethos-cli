import { Command } from '@oclif/core';
import { runCommand } from '@oclif/test';
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

import { getCredentialsPath } from '../../src/lib/config/credentials.js';
import { captureLog, keyInfo, mockFetch, useTempHome } from '../helpers/auth.js';

// --no-browser asks for the key with @inquirer/prompts; answer it here.
mock.module('@inquirer/prompts', () => ({ password: async () => 'pasted-key' }));

describe('login command', () => {
  let temp: ReturnType<typeof useTempHome>;
  let api: ReturnType<typeof mockFetch>;
  let log: ReturnType<typeof captureLog>;
  let stderr: string[];
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    temp = useTempHome();
    log = captureLog();
    stderr = [];
    stderrSpy = spyOn(Command.prototype, 'logToStderr').mockImplementation((message?: string) => {
      stderr.push(message ?? '');
    });
    api = mockFetch(() => ({ body: keyInfo, status: 200 }));
  });

  afterEach(() => {
    api.restore();
    stderrSpy.mockRestore();
    log.restore();
    temp.cleanup();
  });

  test('--json prints only the signed-in key, without its token, and sends the instructions to stderr', async () => {
    const { error } = await runCommand(['login', '--no-browser', '--json']);

    expect(error).toBeUndefined();
    const result = JSON.parse(log.text());
    expect(result).toMatchObject({ address: keyInfo.address, profileId: 42, source: getCredentialsPath() });
    expect(log.text()).not.toContain('pasted-key');
    expect(stderr.join('\n')).toContain('/cli/login');
  });
});
