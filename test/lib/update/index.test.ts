import { describe, expect, test } from 'bun:test';
import { compareVersions } from '../../../src/lib/update/index.js';

describe('compareVersions', () => {
  test('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('0.0.1', '0.0.1')).toBe(0);
    expect(compareVersions('10.20.30', '10.20.30')).toBe(0);
  });

  test('returns 1 when first version is greater (patch)', () => {
    expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.10', '1.0.9')).toBe(1);
    expect(compareVersions('1.0.100', '1.0.99')).toBe(1);
  });

  test('returns -1 when first version is lesser (patch)', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1.0.9', '1.0.10')).toBe(-1);
  });

  test('returns 1 when first version is greater (minor)', () => {
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersions('1.2.0', '1.1.99')).toBe(1);
  });

  test('returns -1 when first version is lesser (minor)', () => {
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
    expect(compareVersions('1.9.0', '1.10.0')).toBe(-1);
  });

  test('returns 1 when first version is greater (major)', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    expect(compareVersions('10.0.0', '9.99.99')).toBe(1);
  });

  test('returns -1 when first version is lesser (major)', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('1.9.9', '2.0.0')).toBe(-1);
  });

  test('handles v prefix', () => {
    expect(compareVersions('v1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', 'v1.0.0')).toBe(0);
    expect(compareVersions('v1.0.1', 'v1.0.0')).toBe(1);
    expect(compareVersions('v1.0.0', 'v1.0.1')).toBe(-1);
  });

  test('handles different segment counts', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.0.0', '1.0')).toBe(0);
    expect(compareVersions('1.0.1', '1.0')).toBe(1);
    expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    expect(compareVersions('1', '1.0.0')).toBe(0);
  });

  test('handles zero versions', () => {
    expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
    expect(compareVersions('0.0.1', '0.0.0')).toBe(1);
    expect(compareVersions('0.0.0', '0.0.1')).toBe(-1);
  });

  test('real-world version comparisons', () => {
    expect(compareVersions('0.0.10', '0.0.9')).toBe(1);
    expect(compareVersions('0.0.11', '0.0.10')).toBe(1);
    expect(compareVersions('0.1.0', '0.0.10')).toBe(1);
    expect(compareVersions('1.0.0', '0.9.9')).toBe(1);
  });
});
