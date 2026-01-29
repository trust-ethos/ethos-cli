import { describe, test, expect } from 'bun:test';
import { runCommand } from '@oclif/test';

describe('user info', () => {
  test('command runs successfully with valid identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'vitalik.eth']);
    expect(error).toBeUndefined();
  });

  test('command accepts --json flag', async () => {
    const { error } = await runCommand(['user', 'info', 'vitalik.eth', '--json']);
    expect(error).toBeUndefined();
  });

  test('command accepts --verbose flag', async () => {
    const { error } = await runCommand(['user', 'info', 'vitalik.eth', '--verbose']);
    expect(error).toBeUndefined();
  });

  test('command accepts address identifier', async () => {
    const { error } = await runCommand(['user', 'info', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']);
    expect(error).toBeUndefined();
  });

  test('command accepts ENS name identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'vitalik.eth']);
    expect(error).toBeUndefined();
  });

  test('command accepts Twitter username identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'VitalikButerin']);
    expect(error).toBeUndefined();
  });

  test('command fails with invalid identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'nonexistent-user-xyz-12345-invalid']);
    expect(error).toBeDefined();
  });

  test('command requires identifier argument', async () => {
    const { error } = await runCommand(['user', 'info']);
    expect(error).toBeDefined();
  });
});
