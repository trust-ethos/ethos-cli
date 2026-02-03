import { describe, test, expect, beforeEach } from 'bun:test';
import { runCommand } from '@oclif/test';
import { mockEchoClientSuccess, mockEchoClientNotFound } from '../../helpers/mock-api.js';

describe('user info', () => {
  beforeEach(() => {
    mockEchoClientSuccess();
  });

  test('displays user info with valid identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'testuser']);
    expect(error).toBeUndefined();
  });

  test('outputs JSON with --json flag', async () => {
    const { error } = await runCommand(['user', 'info', 'testuser', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts --verbose flag', async () => {
    const { error } = await runCommand(['user', 'info', 'testuser', '--verbose']);
    expect(error).toBeUndefined();
  });

  test('accepts -j short flag for JSON', async () => {
    const { error } = await runCommand(['user', 'info', 'testuser', '-j']);
    expect(error).toBeUndefined();
  });

  test('accepts address identifier', async () => {
    const { error } = await runCommand(['user', 'info', '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045']);
    expect(error).toBeUndefined();
  });

  test('accepts ENS name identifier', async () => {
    const { error } = await runCommand(['user', 'info', 'vitalik.eth']);
    expect(error).toBeUndefined();
  });

  test('requires identifier argument', async () => {
    const { error } = await runCommand(['user', 'info']);
    expect(error).toBeDefined();
  });

  test('handles not found error', async () => {
    mockEchoClientNotFound();
    const { error } = await runCommand(['user', 'info', 'nonexistent']);
    expect(error).toBeDefined();
  });
});
