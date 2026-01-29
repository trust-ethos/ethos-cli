import { describe, test, expect } from 'bun:test';
import { runCommand } from '@oclif/test';

describe('user activity', () => {
  test('shows activities for valid user', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts --limit flag', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth', '--limit', '3']);
    expect(error).toBeUndefined();
  });

  test('accepts short -l flag for limit', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth', '-l', '5']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth', '-j']);
    expect(error).toBeUndefined();
  });

  test('rejects limit of 0', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth', '--limit', '0']);
    expect(error).toBeDefined();
  });

  test('rejects limit over 100', async () => {
    const { error } = await runCommand(['user', 'activity', 'vitalik.eth', '--limit', '101']);
    expect(error).toBeDefined();
  });

  test('requires identifier argument', async () => {
    const { error } = await runCommand(['user', 'activity']);
    expect(error).toBeDefined();
  });

  test('handles invalid user gracefully', async () => {
    const { error } = await runCommand(['user', 'activity', 'nonexistent-user-xyz-12345-invalid']);
    expect(error).toBeDefined();
  });
});
