import { Args, Command } from '@oclif/core';
import pc from 'picocolors';

import { saveConfig } from '../../lib/config/index.js';

const SETTABLE_KEYS = ['apiUrl', 'webUrl'] as const;
type SettableKey = (typeof SETTABLE_KEYS)[number];

export default class ConfigSet extends Command {
  static args = {
    value: Args.string({
      description: 'Configuration in format: apiUrl=<url> or webUrl=<url>',
      required: true,
    }),
  };
  static description = 'Set configuration value';
  static examples = [
    '<%= config.bin %> <%= command.id %> apiUrl=https://api.ethos.network',
    '<%= config.bin %> <%= command.id %> apiUrl=https://api.dev.ethos.network',
    '<%= config.bin %> <%= command.id %> webUrl=https://app.ethos.network',
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);

    const separatorIndex = args.value.indexOf('=');
    const key = separatorIndex === -1 ? '' : args.value.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? '' : args.value.slice(separatorIndex + 1);

    if (!isSettableKey(key)) {
      this.error('Invalid format. Use: ethos config set apiUrl=<url> or webUrl=<url>', { exit: 2 });
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      this.error(`Invalid URL: ${value}`, { exit: 2 });
    }

    saveConfig({ [key]: value });
    this.log(`${pc.green('Updated:')} ${key}=${value}`);
  }
}

function isSettableKey(key: string): key is SettableKey {
  return (SETTABLE_KEYS as readonly string[]).includes(key);
}
