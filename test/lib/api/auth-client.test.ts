import { describe, expect, test } from 'bun:test';
import { parseTrpcEnvelope, TrpcError, type PollResult } from '../../../src/lib/api/auth-client.js';

describe('parseTrpcEnvelope', () => {
  test('unwraps a createSession result', () => {
    const body = {
      result: {
        data: {
          json: { expiresAt: '2026-07-09T00:10:00.000Z', nonce: 'abc123', sessionId: 'sess-1' },
        },
      },
    };

    expect(parseTrpcEnvelope(body)).toEqual({
      expiresAt: '2026-07-09T00:10:00.000Z',
      nonce: 'abc123',
      sessionId: 'sess-1',
    });
  });

  test('unwraps a pending poll result', () => {
    const body = { result: { data: { json: { status: 'pending' } } } };
    expect(parseTrpcEnvelope<PollResult>(body)).toEqual({ status: 'pending' });
  });

  test('unwraps a complete poll result', () => {
    const body = {
      result: {
        data: {
          json: {
            apiKey: 'key-abc',
            status: 'complete',
            user: {
              displayName: 'Alice',
              primaryAddress: '0xabc',
              profileId: 1,
              username: 'alice',
            },
          },
        },
      },
    };

    expect(parseTrpcEnvelope<PollResult>(body)).toEqual({
      apiKey: 'key-abc',
      status: 'complete',
      user: { displayName: 'Alice', primaryAddress: '0xabc', profileId: 1, username: 'alice' },
    });
  });

  test('unwraps an expired poll result', () => {
    const body = { result: { data: { json: { status: 'expired' } } } };
    expect(parseTrpcEnvelope<PollResult>(body)).toEqual({ status: 'expired' });
  });

  test('throws TrpcError with message and code on error envelope', () => {
    const body = {
      error: { json: { data: { code: 'NOT_FOUND' }, message: 'Session expired or not found' } },
    };

    expect(() => parseTrpcEnvelope(body)).toThrow(TrpcError);

    try {
      parseTrpcEnvelope(body);
      throw new Error('expected parseTrpcEnvelope to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(TrpcError);
      if (err instanceof TrpcError) {
        expect(err.message).toBe('Session expired or not found');
        expect(err.code).toBe('NOT_FOUND');
      }
    }
  });

  test('throws TrpcError when error envelope has no data.code', () => {
    const body = { error: { json: { message: 'Bad request' } } };

    try {
      parseTrpcEnvelope(body);
      throw new Error('expected parseTrpcEnvelope to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(TrpcError);
      if (err instanceof TrpcError) {
        expect(err.message).toBe('Bad request');
        expect(err.code).toBeUndefined();
      }
    }
  });

  test('throws TrpcError on an unrecognized body shape', () => {
    expect(() => parseTrpcEnvelope({ foo: 'bar' })).toThrow(TrpcError);
  });

  test('throws TrpcError on null body', () => {
    expect(() => parseTrpcEnvelope(null)).toThrow(TrpcError);
  });

  test('throws TrpcError on a result envelope missing json', () => {
    expect(() => parseTrpcEnvelope({ result: { data: {} } })).toThrow(TrpcError);
  });
});
