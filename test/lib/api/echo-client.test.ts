import { describe, expect, test } from 'bun:test';
import { EchoClient } from '../../../src/lib/api/echo-client.js';

describe('EchoClient', () => {
  test('creates client with default prod environment', () => {
    const client = new EchoClient();
    expect(client).toBeDefined();
  });

  test('creates client with staging environment', () => {
    const client = new EchoClient('staging');
    expect(client).toBeDefined();
  });

  test('creates client with dev environment', () => {
    const client = new EchoClient('dev');
    expect(client).toBeDefined();
  });
});
