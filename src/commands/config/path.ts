import { Command } from '@oclif/core';
import { getConfigPath } from '../../lib/config/index.js';

export default class ConfigPath extends Command {
  static description = 'Show config file path';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    this.log(getConfigPath());
  }
}
