import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

const DEFAULT_API_URL = 'https://api.ethos.network';

export interface EthosConfig {
  apiUrl: string;
}

const CONFIG_PATH = join(homedir(), '.config', 'ethos', 'config.json');

export function loadConfig(): EthosConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { apiUrl: DEFAULT_API_URL };
  }
  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    return { 
      apiUrl: parsed.apiUrl || DEFAULT_API_URL,
    };
  } catch {
    return { apiUrl: DEFAULT_API_URL };
  }
}

export function saveConfig(config: Partial<EthosConfig>): void {
  const current = loadConfig();
  const updated = { ...current, ...config };
  
  const dir = dirname(CONFIG_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2) + '\n');
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
