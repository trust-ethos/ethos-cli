import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer, type Server } from 'node:http';

import { CLIError } from '../errors/cli-error.js';

const MAX_BODY_BYTES = 16 * 1024;

const SUCCESS_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Signed in</title></head>
<body style="font-family: system-ui, sans-serif; text-align: center; margin-top: 20vh">
<h1>You’re signed in</h1>
<p>Your terminal is signed in to Ethos. You can close this tab.</p>
</body></html>`;

export interface CallbackServer {
  close(): void;
  port: number;
  /** Resolves with the token from the first POST /callback that carries the right state. */
  waitForToken(timeoutMs: number): Promise<string>;
}

export function statesMatch(expected: string, actual: string): boolean {
  // Hash first so the comparison is constant-time even when the lengths differ.
  const a = createHash('sha256').update(expected).digest();
  const b = createHash('sha256').update(actual).digest();
  return timingSafeEqual(a, b);
}

/** Starts a one-time listener on 127.0.0.1 with an OS-picked port. */
export async function startCallbackServer(state: string): Promise<CallbackServer> {
  let deliver!: (token: string) => void;
  const tokenPromise = new Promise<string>((resolve) => {
    deliver = resolve;
  });
  // The caller may close before anyone awaits, so keep an early rejection quiet.
  tokenPromise.catch(() => {});

  const server = createServer((request, response) => {
    if (request.method !== 'POST' || request.url !== '/callback') {
      response.writeHead(404).end();
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;

    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => {
      if (tooLarge) {
        response.writeHead(413).end();
        return;
      }

      const form = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
      const token = form.get('token')?.trim();
      if (!token || !statesMatch(state, form.get('state') ?? '')) {
        response.writeHead(400, { 'Content-Type': 'text/plain' }).end('Invalid sign-in request.');
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(SUCCESS_PAGE, () => {
        deliver(token);
      });
    });
  });

  await listen(server);
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new CLIError('Could not start the local sign-in listener.', 'LISTEN_FAILED', [
      'Run: ethos login --no-browser',
    ]);
  }

  return {
    close() {
      server.close();
      server.closeAllConnections();
    },
    port: address.port,
    async waitForToken(timeoutMs: number) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new CLIError(`Timed out after ${Math.round(timeoutMs / 1000)} seconds waiting for the browser.`, 'LOGIN_TIMEOUT', [
              'Run: ethos login --no-browser',
              'Or allow more time with --timeout <seconds>',
            ]),
          );
        }, timeoutMs);
      });

      try {
        return await Promise.race([tokenPromise, timeout]);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
}
