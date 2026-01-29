import { describe, test, expect } from 'bun:test';
import { runCommand } from '@oclif/test';

describe('user search', () => {
  test('executes search query successfully', async () => {
    const { error } = await runCommand(['user', 'search', 'vitalik']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['user', 'search', 'vitalik', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts --limit flag', async () => {
    const { error } = await runCommand(['user', 'search', 'crypto', '--limit', '3']);
    expect(error).toBeUndefined();
  });

  test('accepts short -l flag for limit', async () => {
    const { error } = await runCommand(['user', 'search', 'eth', '-l', '5']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['user', 'search', 'vitalik', '-j']);
    expect(error).toBeUndefined();
  });

  test('rejects limit of 0', async () => {
    const { error } = await runCommand(['user', 'search', 'test', '--limit', '0']);
    expect(error).toBeDefined();
  });

  test('rejects limit over 100', async () => {
    const { error } = await runCommand(['user', 'search', 'test', '--limit', '101']);
    expect(error).toBeDefined();
  });

  test('requires query argument', async () => {
    const { error } = await runCommand(['user', 'search']);
    expect(error).toBeDefined();
  });
});
