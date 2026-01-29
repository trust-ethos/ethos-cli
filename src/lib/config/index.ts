import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface EthosConfig {
  environment?: 'prod' | 'staging' | 'dev';
  apiUrl?: string;
  defaultOutput?: 'json' | 'text';
}

const CONFIG_PATH = join(homedir(), '.config', 'ethos', 'config.json');

export function loadConfig(): EthosConfig {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(content) as EthosConfig;
  } catch {
    return {};
  }
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
