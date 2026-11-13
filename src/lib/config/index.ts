import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const DEFAULT_API_URL = 'https://api.ethos.network';

export interface EthosConfig {
  apiUrl: string;
}

// Resolved on each call, and ETHOS_CONFIG_DIR moves the directory, so tests never touch the real one.
function configPath(): string {
  const dir = process.env.ETHOS_CONFIG_DIR || join(homedir(), '.config', 'ethos');
  return join(dir, 'config.json');
}

export function loadConfig(): EthosConfig {
  if (!existsSync(configPath())) {
    return { apiUrl: DEFAULT_API_URL };
  }

  try {
    const content = readFileSync(configPath(), 'utf8');
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
  
  const dir = dirname(configPath());
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeFileSync(configPath(), JSON.stringify(updated, null, 2) + '\n');
}

export function getConfigPath(): string {
  return configPath();
}
