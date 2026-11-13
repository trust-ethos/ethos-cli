import { Command, Flags } from '@oclif/core';

import { runLogin } from '../lib/auth/login.js';
import { loadConfig } from '../lib/config/index.js';
import { formatError } from '../lib/formatting/error.js';

export default class Login extends Command {
  static description = 'Sign in to Ethos and store an API key for this machine';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --no-browser',
    '<%= config.bin %> <%= command.id %> --timeout 600',
  ];
static flags = {
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

    let failure: Error | undefined;
    try {
      await runLogin({
        apiUrl: loadConfig().apiUrl,
        log: (message) => this.log(message),
        noBrowser: flags['no-browser'],
        timeoutSeconds: flags.timeout,
      });
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      failure = error;
    }

    if (failure) {
      this.log(formatError(failure, flags.verbose));
      this.exit(1);
    }
  }
}
