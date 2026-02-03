import { describe, expect, test } from 'bun:test';
import { EchoClient } from '../../../src/lib/api/echo-client.js';

describe('EchoClient', () => {
  describe('constructor', () => {
    test('creates client using config file', () => {
      const client = new EchoClient();
      expect(client).toBeDefined();
    });
  });
});
