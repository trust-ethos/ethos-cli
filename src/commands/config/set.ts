import { Args, Command } from '@oclif/core';
import pc from 'picocolors';

import { saveConfig } from '../../lib/config/index.js';

export default class ConfigSet extends Command {
  static args = {
    value: Args.string({
      description: 'Configuration in format: apiUrl=<url>',
      required: true,
    }),
  };
static description = 'Set configuration value';
static examples = [
    '<%= config.bin %> <%= command.id %> apiUrl=https://api.ethos.network',
    '<%= config.bin %> <%= command.id %> apiUrl=https://api.dev.ethos.network',
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    
    if (!args.value.startsWith('apiUrl=')) {
      this.error('Invalid format. Use: ethos config set apiUrl=<url>', { exit: 2 });
    }

    const apiUrl = args.value.slice('apiUrl='.length);
    
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      this.error(`Invalid URL: ${apiUrl}`, { exit: 2 });
    }

    saveConfig({ apiUrl });
    this.log(`${pc.green('Updated:')} apiUrl=${apiUrl}`);
  }
}
