import { describe, test, expect, beforeEach } from 'bun:test';
import { runCommand } from '@oclif/test';
import { mockEchoClientSuccess, mockEchoClientNotFound } from '../../helpers/mock-api.js';

describe('xp rank', () => {
  beforeEach(() => {
    mockEchoClientSuccess();
  });

  test('shows rank for valid user', async () => {
    const { error } = await runCommand(['xp', 'rank', 'testuser']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['xp', 'rank', 'testuser', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts ETH address identifier', async () => {
    const { error } = await runCommand(['xp', 'rank', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']);
    expect(error).toBeUndefined();
  });

  test('accepts --verbose flag', async () => {
    const { error } = await runCommand(['xp', 'rank', 'testuser', '--verbose']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['xp', 'rank', 'testuser', '-j']);
    expect(error).toBeUndefined();
  });

  test('requires identifier argument', async () => {
    const { error } = await runCommand(['xp', 'rank']);
    expect(error).toBeDefined();
  });

  test('handles user not found gracefully', async () => {
    mockEchoClientNotFound();
    const { error } = await runCommand(['xp', 'rank', 'nonexistent']);
    expect(error).toBeDefined();
  });
});
