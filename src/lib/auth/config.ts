import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface AuthUser {
  displayName: string;
  primaryAddress: string;
  profileId: null | number;
  username: null | string;
}

export interface AuthConfig {
  apiKey: string;
  createdAt: string;
  user: AuthUser;
}

const AUTH_CONFIG_PATH = join(homedir(), '.ethos', 'config.json');

export function getAuthConfigPath(): string {
  return AUTH_CONFIG_PATH;
}

/**
 * Load the auth config from ~/.ethos/config.json.
 * Returns null if not found or invalid.
 */
export function loadAuthConfig(): AuthConfig | null {
  if (!existsSync(AUTH_CONFIG_PATH)) {
    return null;
  }

  try {
    const content = readFileSync(AUTH_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(content);

    if (!parsed.apiKey || !parsed.user) {
      return null;
    }

    return parsed as AuthConfig;
  } catch {
    return null;
  }
}

/**
 * Save auth config to ~/.ethos/config.json with 0o600 permissions.
 */
export function saveAuthConfig(config: AuthConfig): void {
  const dir = dirname(AUTH_CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
}

/**
 * Delete the auth config file.
 */
export function deleteAuthConfig(): void {
  if (existsSync(AUTH_CONFIG_PATH)) {
    unlinkSync(AUTH_CONFIG_PATH);
  }
}

/**
 * Get the API key from ETHOS_API_KEY env var or auth config.
 * Env var takes precedence (for CI usage).
 */
export function getApiKey(): null | string {
  return process.env.ETHOS_API_KEY || loadAuthConfig()?.apiKey || null;
}
