import { describe, test, expect } from 'bun:test';
import { runCommand } from '@oclif/test';

describe('xp rank', () => {
  test('shows rank for valid user', async () => {
    const { error } = await runCommand(['xp', 'rank', 'vitalik.eth']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['xp', 'rank', 'vitalik.eth', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts ETH address identifier', async () => {
    const { error } = await runCommand(['xp', 'rank', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']);
    expect(error).toBeUndefined();
  });

  test('accepts --verbose flag', async () => {
    const { error } = await runCommand(['xp', 'rank', 'vitalik.eth', '--verbose']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['xp', 'rank', 'vitalik.eth', '-j']);
    expect(error).toBeUndefined();
  });

  test('requires identifier argument', async () => {
    const { error } = await runCommand(['xp', 'rank']);
    expect(error).toBeDefined();
  });

  test('handles user not found gracefully', async () => {
    const { error } = await runCommand(['xp', 'rank', 'nonexistent-user-xyz-12345-invalid']);
    expect(error).toBeDefined();
  });
});
