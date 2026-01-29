import { describe, test, expect } from 'bun:test';
import { runCommand } from '@oclif/test';

describe('xp seasons', () => {
  test('lists seasons successfully', async () => {
    const { error } = await runCommand(['xp', 'seasons']);
    expect(error).toBeUndefined();
  });

  test('accepts --json flag', async () => {
    const { error } = await runCommand(['xp', 'seasons', '--json']);
    expect(error).toBeUndefined();
  });

  test('accepts --verbose flag', async () => {
    const { error } = await runCommand(['xp', 'seasons', '--verbose']);
    expect(error).toBeUndefined();
  });

  test('accepts short -j flag for json', async () => {
    const { error } = await runCommand(['xp', 'seasons', '-j']);
    expect(error).toBeUndefined();
  });

  test('accepts short -v flag for verbose', async () => {
    const { error } = await runCommand(['xp', 'seasons', '-v']);
    expect(error).toBeUndefined();
  });
});
