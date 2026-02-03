import { describe, test, expect, beforeEach } from 'bun:test';
import { runCommand } from '@oclif/test';
import { mockEchoClientSuccess } from '../../helpers/mock-api.js';

describe('user search', () => {
  beforeEach(() => {
    mockEchoClientSuccess();
  });

  test('executes search query successfully', async () => {
    const { error } = await runCommand(['user', 'search', 'test']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['user', 'search', 'test', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts --limit flag', async () => {
    const { error } = await runCommand(['user', 'search', 'test', '--limit', '3']);
    expect(error).toBeUndefined();
  });

  test('accepts short -l flag for limit', async () => {
    const { error } = await runCommand(['user', 'search', 'test', '-l', '5']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['user', 'search', 'test', '-j']);
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
