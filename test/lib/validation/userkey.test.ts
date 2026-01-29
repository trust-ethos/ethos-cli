import { describe, expect, test } from 'bun:test';
import { isValidIdentifier, parseIdentifier, parseUserkey } from '../../../src/lib/validation/userkey.js';

describe('parseIdentifier', () => {
  test('detects Ethereum address', () => {
    const result = parseIdentifier('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result.type).toBe('address');
    expect(result.value).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });

  test('detects ENS name', () => {
    const result = parseIdentifier('vitalik.eth');
    expect(result.type).toBe('ens');
    expect(result.value).toBe('vitalik.eth');
  });

  test('detects Twitter username', () => {
    const result = parseIdentifier('0xNowater');
    expect(result.type).toBe('twitter');
    expect(result.value).toBe('0xNowater');
  });

  test('parses explicit address prefix', () => {
    const result = parseIdentifier('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result.type).toBe('address');
    expect(result.value).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });

  test('parses explicit twitter prefix', () => {
    const result = parseIdentifier('twitter:vitalik');
    expect(result.type).toBe('twitter');
    expect(result.value).toBe('vitalik');
  });

  test('parses service:x.com format', () => {
    const result = parseIdentifier('service:x.com:123456789');
    expect(result.type).toBe('twitter');
    expect(result.value).toBe('123456789');
  });

  test('parses profileId', () => {
    const result = parseIdentifier('profileId:21');
    expect(result.type).toBe('profileId');
    expect(result.value).toBe('21');
  });

  test('treats numeric string as profileId', () => {
    const result = parseIdentifier('12345');
    expect(result.type).toBe('profileId');
    expect(result.value).toBe('12345');
  });
});

describe('parseUserkey (deprecated)', () => {
  test('parses Ethereum address', () => {
    const result = parseUserkey('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });

  test('preserves plain username', () => {
    const result = parseUserkey('vitalik.eth');
    expect(result).toBe('vitalik.eth');
  });

  test('preserves already formatted userkey', () => {
    const result = parseUserkey('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    expect(result).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });
});

describe('isValidIdentifier', () => {
  test('validates non-empty string', () => {
    expect(isValidIdentifier('vitalik.eth')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(isValidIdentifier('')).toBe(false);
  });

  test('rejects whitespace-only string', () => {
    expect(isValidIdentifier('   ')).toBe(false);
  });
});
