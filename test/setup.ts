import { afterEach, beforeEach } from 'bun:test';

const originalExit = process.exit;
const originalExitCode = process.exitCode;

beforeEach(() => {
  process.exitCode = undefined;
  (process as any).exit = (code?: number) => {
    process.exitCode = code ?? 1;
  };
});

afterEach(() => {
  (process as any).exit = originalExit;
  process.exitCode = originalExitCode;
});
