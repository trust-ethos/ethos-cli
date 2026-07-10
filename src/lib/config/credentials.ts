import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import { ValidationError } from '../errors/cli-error.js';
import { loadConfig } from './index.js';

const FILE_MODE = 0o600;
const ACCOUNT_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export interface StoredUser {
  displayName: string;
  primaryAddress: string;
  profileId: null | number;
  username: null | string;
}

export interface Account {
  apiKey: string;
  apiUrl: string;
  createdAt: string;
  user: StoredUser;
}

export interface AccountSummary {
  active: boolean;
  apiUrl: string;
  name: string;
  user: StoredUser;
}

export interface ActiveAccount {
  apiKey: string;
  apiUrl: string;
  name: string;
  user: StoredUser;
}

interface CredentialsFileV2 {
  accounts: Record<string, Account>;
  activeAccount: null | string;
  version: 2;
}

// Pre-migration shape: one credential per apiUrl, no account names.
interface LegacyStoredCredential {
  apiKey: string;
  createdAt: string;
  user: StoredUser;
}

interface CredentialsFileV1 {
  credentials: Record<string, LegacyStoredCredential>;
  version?: 1;
}

// Overridable for tests so we never touch the real user home directory.
let credentialsPathOverride: null | string = null;

export function getCredentialsPath(): string {
  return credentialsPathOverride ?? join(homedir(), '.config', 'ethos', 'credentials.json');
}

export function setCredentialsPathForTesting(path: null | string): void {
  credentialsPathOverride = path;
}

function emptyFile(): CredentialsFileV2 {
  return { accounts: {}, activeAccount: null, version: 2 };
}

function isV2File(parsed: unknown): parsed is CredentialsFileV2 {
  if (!parsed || typeof parsed !== 'object') return false;
  const candidate = parsed as { accounts?: unknown; version?: unknown };
  return (
    candidate.version === 2 && typeof candidate.accounts === 'object' && candidate.accounts !== null
  );
}

function isV1File(parsed: unknown): parsed is CredentialsFileV1 {
  if (!parsed || typeof parsed !== 'object') return false;
  const candidate = parsed as { credentials?: unknown };
  return typeof candidate.credentials === 'object' && candidate.credentials !== null;
}

/** Derives a valid account name from a username (or falls back to 'default'). */
export function sanitizeAccountName(raw: null | string): string {
  const base = (raw ?? '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');

  return base || 'default';
}

function dedupeAccountName(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;

  return `${base}-${suffix}`;
}

function migrateFromV1(v1: CredentialsFileV1): CredentialsFileV2 {
  const accounts: Record<string, Account> = {};
  const takenNames = new Set<string>();
  let activeAccount: null | string = null;

  for (const [apiUrl, credential] of Object.entries(v1.credentials)) {
    const name = dedupeAccountName(sanitizeAccountName(credential.user.username), takenNames);
    takenNames.add(name);
    accounts[name] = {
      apiKey: credential.apiKey,
      apiUrl,
      createdAt: credential.createdAt,
      user: credential.user,
    };
    activeAccount ??= name;
  }

  return { accounts, activeAccount, version: 2 };
}

function readFile(): CredentialsFileV2 {
  const path = getCredentialsPath();

  if (!existsSync(path)) {
    return emptyFile();
  }

  try {
    const content = readFileSync(path, 'utf8');
    const parsed: unknown = JSON.parse(content);

    if (isV2File(parsed)) {
      return parsed;
    }

    if (isV1File(parsed)) {
      const migrated = migrateFromV1(parsed);
      writeFile(migrated);
      return migrated;
    }

    return emptyFile();
  } catch {
    return emptyFile();
  }
}

function writeFile(data: CredentialsFileV2): void {
  const path = getCredentialsPath();
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', { mode: FILE_MODE });
  // Repair permissions on a pre-existing file the mode option above wouldn't touch.
  chmodSync(path, FILE_MODE);
}

function assertValidAccountName(name: string): void {
  if (!ACCOUNT_NAME_PATTERN.test(name)) {
    throw new ValidationError(
      `Invalid account name "${name}". Use lowercase letters, numbers, and hyphens, starting with a letter or number.`,
    );
  }
}

function toActiveAccount(name: string, account: Account): ActiveAccount {
  return { apiKey: account.apiKey, apiUrl: account.apiUrl, name, user: account.user };
}

export function listAccounts(): AccountSummary[] {
  const file = readFile();

  return Object.entries(file.accounts).map(([name, account]) => ({
    active: name === file.activeAccount,
    apiUrl: account.apiUrl,
    name,
    user: account.user,
  }));
}

export function getActiveAccount(): ActiveAccount | null {
  const file = readFile();
  if (!file.activeAccount) return null;

  const account = file.accounts[file.activeAccount];
  if (!account) return null;

  return toActiveAccount(file.activeAccount, account);
}

export function getAccount(name: string): ActiveAccount | null {
  const file = readFile();
  const account = file.accounts[name];

  return account ? toActiveAccount(name, account) : null;
}

export function addAccount(
  name: string,
  input: { apiKey: string; apiUrl: string; user: StoredUser },
): void {
  assertValidAccountName(name);
  const file = readFile();
  const hadNoAccounts = Object.keys(file.accounts).length === 0;

  file.accounts[name] = {
    apiKey: input.apiKey,
    apiUrl: input.apiUrl,
    createdAt: new Date().toISOString(),
    user: input.user,
  };

  if (hadNoAccounts || !file.activeAccount) {
    file.activeAccount = name;
  }

  writeFile(file);
}

export function setActiveAccount(name: string): void {
  const file = readFile();

  if (!file.accounts[name]) {
    throw new ValidationError(`No account named "${name}". Run: ethos account list`);
  }

  file.activeAccount = name;
  writeFile(file);
}

export function removeAccount(name: string): void {
  const file = readFile();

  if (!(name in file.accounts)) {
    return;
  }

  delete file.accounts[name];

  if (file.activeAccount === name) {
    const [nextActive] = Object.keys(file.accounts);
    file.activeAccount = nextActive ?? null;
  }

  writeFile(file);
}

export function clearAllAccounts(): void {
  writeFile(emptyFile());
}

function resolveAccount(accountOverride?: string): ActiveAccount | null {
  if (accountOverride) {
    const account = getAccount(accountOverride);
    if (!account) {
      throw new ValidationError(`No account named "${accountOverride}". Run: ethos account list`);
    }

    return account;
  }

  return getActiveAccount();
}

/**
 * API base URL to use for this invocation. An explicit account override wins,
 * then the active account, then config.json's default apiUrl.
 */
export function getEffectiveApiUrl(accountOverride?: string): string {
  const account = resolveAccount(accountOverride);
  return account?.apiUrl ?? loadConfig().apiUrl;
}

/** API key for this invocation's account, or null when signed out. */
export function getActiveApiKey(accountOverride?: string): null | string {
  return resolveAccount(accountOverride)?.apiKey ?? null;
}
