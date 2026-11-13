import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { getConfigPath } from './index.js';

export interface StoredCredential {
  address: string;
  expiresAt: string;
  id: number;
  profileId: number;
  scopes: string[];
  token: string;
}

export type CredentialsFile = Record<string, StoredCredential>;

export interface ResolvedCredential {
  credential: Partial<StoredCredential> & Pick<StoredCredential, 'token'>;
  /** `env` for ETHOS_API_KEY, otherwise the path of the credentials file. */
  source: string;
}

export function getCredentialsPath(): string {
  return join(dirname(getConfigPath()), 'credentials.json');
}

/** Keys are stored per API, so `https://api.ethos.network/` and `https://api.ethos.network` are one entry. */
export function normalizeApiUrl(apiUrl: string): string {
  return apiUrl.replace(/\/+$/, '');
}

export function readCredentials(): CredentialsFile {
  const path = getCredentialsPath();
  if (!existsSync(path)) return {};

  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as CredentialsFile) : {};
  } catch {
    return {};
  }
}

export function getStoredCredential(apiUrl: string): StoredCredential | undefined {
  return readCredentials()[normalizeApiUrl(apiUrl)];
}

export function saveCredential(apiUrl: string, credential: StoredCredential): void {
  writeCredentials({ ...readCredentials(), [normalizeApiUrl(apiUrl)]: credential });
}

/** Removes one API's entry and leaves the others. Deletes the file once it is empty. */
export function deleteCredential(apiUrl: string): void {
  const rest = readCredentials();
  delete rest[normalizeApiUrl(apiUrl)];
  if (Object.keys(rest).length === 0) {
    rmSync(getCredentialsPath(), { force: true });
    return;
  }

  writeCredentials(rest);
}

/** The key a command should use: ETHOS_API_KEY wins over the stored one. */
export function resolveCredential(apiUrl: string): ResolvedCredential | undefined {
  const envKey = process.env.ETHOS_API_KEY?.trim();
  if (envKey) return { credential: { token: envKey }, source: 'env' };

  const stored = getStoredCredential(apiUrl);
  return stored ? { credential: stored, source: getCredentialsPath() } : undefined;
}

function writeCredentials(file: CredentialsFile): void {
  const path = getCredentialsPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { mode: 0o700, recursive: true });

  writeFileSync(path, JSON.stringify(file, null, 2) + '\n', { mode: 0o600 });
  // writeFileSync only applies the mode when it creates the file.
  chmodSync(path, 0o600);
}
