import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const DEFAULT_API_URL = 'https://api.ethos.network';
const DEFAULT_LOCAL_WEB_URL = 'http://localhost:3000';

export interface EthosConfig {
  apiUrl: string;
  webUrl?: string;
}

// Overridable for tests so we never touch the real user home directory.
let configPathOverride: null | string = null;

function getConfigPathInternal(): string {
  return configPathOverride ?? join(homedir(), '.config', 'ethos', 'config.json');
}

export function setConfigPathForTesting(path: null | string): void {
  configPathOverride = path;
}

export function loadConfig(): EthosConfig {
  const configPath = getConfigPathInternal();

  if (!existsSync(configPath)) {
    return { apiUrl: DEFAULT_API_URL };
  }

  try {
    const content = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(content);
    const config: EthosConfig = { apiUrl: parsed.apiUrl || DEFAULT_API_URL };
    if (typeof parsed.webUrl === 'string' && parsed.webUrl) {
      config.webUrl = parsed.webUrl;
    }

    return config;
  } catch {
    return { apiUrl: DEFAULT_API_URL };
  }
}

/**
 * Web app URL to pair with the configured API. Explicit `webUrl` config wins;
 * otherwise it's derived from `apiUrl` (localhost API -> localhost:3000 web,
 * `api.<host>` -> `<host>`, with the production `api.ethos.network` special-cased
 * to `app.ethos.network` since the bare domain is the marketing site).
 */
export function getWebUrl(): string {
  const config = loadConfig();
  if (config.webUrl) return config.webUrl;

  try {
    const url = new URL(config.apiUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return DEFAULT_LOCAL_WEB_URL;
    }

    if (url.hostname === 'api.ethos.network') {
      return 'https://app.ethos.network';
    }

    if (url.hostname.startsWith('api.')) {
      return `https://${url.hostname.slice('api.'.length)}`;
    }

    return DEFAULT_LOCAL_WEB_URL;
  } catch {
    return DEFAULT_LOCAL_WEB_URL;
  }
}

export function saveConfig(config: Partial<EthosConfig>): void {
  const current = loadConfig();
  const updated = { ...current, ...config };
  const configPath = getConfigPathInternal();

  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(configPath, JSON.stringify(updated, null, 2) + '\n');
}

export function getConfigPath(): string {
  return getConfigPathInternal();
}
