import { afterEach, describe, expect, test } from 'bun:test';

import { type CallbackServer, startCallbackServer } from '../../../src/lib/auth/callback-server.js';

const STATE = 'a'.repeat(64);

function post(server: CallbackServer, fields: Record<string, string>, path = '/callback'): Promise<Response> {
  return fetch(`http://127.0.0.1:${server.port}${path}`, {
    body: new URLSearchParams(fields),
    method: 'POST',
  });
}

describe('callback server', () => {
  let server: CallbackServer | undefined;

  afterEach(() => {
    server?.close();
    server = undefined;
  });

  test('returns the token when the state matches, and shows the signed-in page', async () => {
    server = await startCallbackServer(STATE);
    const waiting = server.waitForToken(5000);

    const response = await post(server, { state: STATE, token: 'secret-key' });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('close this tab');
    expect(await waiting).toBe('secret-key');
  });

  test('answers a wrong state with 400 and keeps waiting for the right one', async () => {
    server = await startCallbackServer(STATE);
    const waiting = server.waitForToken(5000);

    const wrong = await post(server, { state: 'b'.repeat(64), token: 'attacker-key' });
    const missing = await post(server, { token: 'attacker-key' });
    expect(wrong.status).toBe(400);
    expect(missing.status).toBe(400);

    await post(server, { state: STATE, token: 'real-key' });
    expect(await waiting).toBe('real-key');
  });

  test('rejects anything but POST /callback', async () => {
    server = await startCallbackServer(STATE);

    expect((await post(server, { state: STATE, token: 'k' }, '/other')).status).toBe(404);
    expect((await fetch(`http://127.0.0.1:${server.port}/callback?state=${STATE}&token=k`)).status).toBe(404);
  });

  test('times out when nothing arrives', async () => {
    server = await startCallbackServer(STATE);

    await expect(server.waitForToken(50)).rejects.toThrow('Timed out');
  });

  test('stops listening once closed', async () => {
    server = await startCallbackServer(STATE);
    const { port } = server;
    server.close();
    server = undefined;

    await expect(fetch(`http://127.0.0.1:${port}/callback`, { method: 'POST' })).rejects.toThrow();
  });
});
