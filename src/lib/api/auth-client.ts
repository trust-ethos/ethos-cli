import { NetworkError } from '../errors/cli-error.js';
import { httpFetch } from '../http/fetch.js';

const TRPC_TIMEOUT_MS = 10_000;

export interface CreateSessionResult {
  expiresAt: string;
  nonce: string;
  sessionId: string;
}

export interface PollSessionUser {
  displayName: string;
  primaryAddress: string;
  profileId: null | number;
  username: null | string;
}

export type PollResult =
  | { apiKey: string; status: 'complete'; user: PollSessionUser }
  | { status: 'expired' }
  | { status: 'pending' };

export class TrpcError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'TrpcError';
  }
}

interface TrpcErrorEnvelope {
  error: { json: { data?: { code?: string }; message: string } };
}

interface TrpcSuccessEnvelope<T> {
  result: { data: { json: T } };
}

function isTrpcErrorEnvelope(body: unknown): body is TrpcErrorEnvelope {
  return Boolean(body) && typeof body === 'object' && 'error' in (body as object);
}

function isTrpcSuccessEnvelope<T>(body: unknown): body is TrpcSuccessEnvelope<T> {
  if (!body || typeof body !== 'object' || !('result' in body)) return false;
  const { result } = body as { result: unknown };
  if (!result || typeof result !== 'object' || !('data' in result)) return false;
  const { data } = result as { data: unknown };
  if (!data || typeof data !== 'object' || !('json' in data)) return false;

  return true;
}

export function parseTrpcEnvelope<T>(body: unknown): T {
  if (isTrpcErrorEnvelope(body)) {
    throw new TrpcError(body.error.json.message, body.error.json.data?.code);
  }

  if (isTrpcSuccessEnvelope<T>(body)) {
    return body.result.data.json;
  }

  throw new TrpcError('Unexpected response shape from server');
}

async function trpcRequest<T>(url: string, init?: Parameters<typeof fetch>[1]): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRPC_TIMEOUT_MS);

  try {
    const response = await httpFetch(url, {
      headers: { 'Content-Type': 'application/json', 'X-Ethos-Client': 'ethos-cli' },
      signal: controller.signal,
      ...init,
    });

    const body: unknown = await response.json();

    return parseTrpcEnvelope<T>(body);
  } catch (error) {
    if (error instanceof TrpcError) throw error;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timed out after 10 seconds', url);
      }

      throw new NetworkError(error.message, url);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function createSession(
  apiUrl: string,
  hostname: string,
): Promise<CreateSessionResult> {
  return trpcRequest<CreateSessionResult>(`${apiUrl}/api/v2/trpc/cliAuth.createSession`, {
    body: JSON.stringify({ json: { hostname } }),
    method: 'POST',
  });
}

export async function pollSession(apiUrl: string, sessionId: string): Promise<PollResult> {
  // POST: poll is a tRPC mutation — the complete-state read is one-time
  // (server deletes the session on delivery), so it must not be a GET.
  return trpcRequest<PollResult>(`${apiUrl}/api/v2/trpc/cliAuth.poll`, {
    body: JSON.stringify({ json: { sessionId } }),
    method: 'POST',
  });
}
