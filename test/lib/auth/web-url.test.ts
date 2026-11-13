import { describe, expect, test } from 'bun:test';

import { buildLoginUrl, getWebUrl } from '../../../src/lib/auth/web-url.js';

describe('web url', () => {
  test('maps each API to its web app', () => {
    expect(getWebUrl('https://api.ethos.network')).toBe('https://app.ethos.network');
    expect(getWebUrl('https://api.dev.ethos.network/')).toBe('https://dev.ethos.network');
    expect(getWebUrl('http://localhost:8080')).toBe('http://localhost:8082');
  });

  test('refuses an API it has no sign-in page for', () => {
    expect(() => getWebUrl('https://example.com')).toThrow('No sign-in page');
  });

  test('builds the login URL with and without a port', () => {
    expect(buildLoginUrl('https://app.ethos.network', { host: 'my laptop', port: 5555, state: 'abc' })).toBe(
      'https://app.ethos.network/cli/login?port=5555&state=abc&host=my+laptop',
    );
    expect(buildLoginUrl('https://app.ethos.network', { host: 'box' })).toBe(
      'https://app.ethos.network/cli/login?host=box',
    );
  });
});
