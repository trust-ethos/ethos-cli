import { Command, Flags } from '@oclif/core';

import { runLogin } from '../lib/auth/login.js';
import { getCredentialsPath } from '../lib/config/credentials.js';
import { loadConfig } from '../lib/config/index.js';
import { formatError } from '../lib/formatting/error.js';
import { output } from '../lib/formatting/output.js';

export default class Login extends Command {
  static description = 'Sign in to Ethos and store an API key for this machine';
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --no-browser',
    '<%= config.bin %> <%= command.id %> --timeout 600',
    '<%= config.bin %> <%= command.id %> --json',
  ];
  static flags = {
    json: Flags.boolean({ char: 'j', description: 'Output the signed-in key as JSON; instructions go to stderr' }),
    'no-browser': Flags.boolean({
      description: 'Print the sign-in page instead of opening it, then paste the key it shows',
    }),
    timeout: Flags.integer({
      default: 300,
      description: 'Seconds to wait for the browser to finish signing in',
      min: 1,
    }),
    verbose: Flags.boolean({ char: 'v', description: 'Show detailed error information' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Login);

    try {
      const info = await runLogin({
        apiUrl: loadConfig().apiUrl,
        log: (message) => (flags.json ? this.logToStderr(message) : this.log(message)),
        noBrowser: flags['no-browser'],
        timeoutSeconds: flags.timeout,
      });
      if (flags.json) this.log(output({ ...info, source: getCredentialsPath() }));
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      this.log(formatError(error, flags.verbose));
      this.exit(1);
    }
  }
}
