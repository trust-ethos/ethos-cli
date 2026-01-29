import { describe, expect, test } from 'bun:test';
import { isValidUserkey, parseUserkey } from '../../../src/lib/validation/userkey.js';

describe('parseUserkey', () => {
  test('parses Ethereum address', () => {
    const result = parseUserkey('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });

  test('parses plain username', () => {
    const result = parseUserkey('vitalik.eth');
    expect(result).toBe('vitalik.eth');
  });

  test('preserves already formatted userkey', () => {
    const result = parseUserkey('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });

  test('preserves service userkey', () => {
    const result = parseUserkey('service:discord:123456789');
    expect(result).toBe('service:discord:123456789');
  });
});

describe('isValidUserkey', () => {
  test('validates non-empty string', () => {
    expect(isValidUserkey('vitalik.eth')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(isValidUserkey('')).toBe(false);
  });

  test('rejects whitespace-only string', () => {
    expect(isValidUserkey('   ')).toBe(false);
  });
});
