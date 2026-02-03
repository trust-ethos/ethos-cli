import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';

import { getConfigPath, loadConfig } from '../../lib/config/index.js';

export default class ConfigGet extends Command {
  static description = 'Show current configuration';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
  ];
static flags = {
    json: Flags.boolean({
      char: 'j',
      default: false,
      description: 'Output as JSON',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigGet);
    const config = loadConfig();
    const configPath = getConfigPath();

    if (flags.json) {
      this.log(JSON.stringify({ ...config, configPath }, null, 2));
    } else {
      this.log(`${pc.dim('apiUrl:')} ${config.apiUrl}`);
      this.log(`${pc.dim('config:')} ${configPath}`);
    }
  }
}
