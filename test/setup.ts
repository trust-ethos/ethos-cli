import { afterAll, afterEach, beforeEach } from 'bun:test';

const originalExit = process.exit;

beforeEach(() => {
  process.exitCode = undefined;
  (process as any).exit = (code?: number) => {
    process.exitCode = code ?? 1;
  };
});

afterEach(() => {
  (process as any).exit = originalExit;
  process.exitCode = undefined;
});

afterAll(() => {
  process.exitCode = 0;
});
