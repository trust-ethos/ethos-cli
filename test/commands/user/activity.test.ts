import { describe, test, expect, beforeEach } from 'bun:test';
import { runCommand } from '@oclif/test';
import { mockEchoClientSuccess, mockEchoClientNotFound } from '../../helpers/mock-api.js';

describe('user activity', () => {
  beforeEach(() => {
    mockEchoClientSuccess();
  });

  test('shows activities for valid user', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts --limit flag', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser', '--limit', '3']);
    expect(error).toBeUndefined();
  });

  test('accepts short -l flag for limit', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser', '-l', '5']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser', '-j']);
    expect(error).toBeUndefined();
  });

  test('rejects limit of 0', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser', '--limit', '0']);
    expect(error).toBeDefined();
  });

  test('rejects limit over 100', async () => {
    const { error } = await runCommand(['user', 'activity', 'testuser', '--limit', '101']);
    expect(error).toBeDefined();
  });

  test('requires identifier argument', async () => {
    const { error } = await runCommand(['user', 'activity']);
    expect(error).toBeDefined();
  });

  test('handles invalid user gracefully', async () => {
    mockEchoClientNotFound();
    const { error } = await runCommand(['user', 'activity', 'nonexistent']);
    expect(error).toBeDefined();
  });
});
