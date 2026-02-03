import { Command, Flags, ux } from '@oclif/core';
import { EchoClient } from './api/echo-client.js';

/**
 * Base class for Ethos CLI commands providing shared flags, API client, and error handling.
 * Extend with: static flags = { ...BaseCommand.baseFlags, myFlag: ... }
 */
export abstract class BaseCommand extends Command {
  static baseFlags = {
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed error information',
      default: false,
    }),
  };

  private _client?: EchoClient;

  protected get client(): EchoClient {
    if (!this._client) {
      this._client = new EchoClient();
    }
    return this._client;
  }

  /**
   * Execute async operation with spinner. Spinner hidden in JSON mode or non-TTY.
   */
  protected async withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T> {
    const flags = await this.getFlags();
    const showSpinner = !flags.json && process.stdout.isTTY;

    if (showSpinner) {
      ux.action.start(message);
    }

    try {
      const result = await fn();
      if (showSpinner) {
        ux.action.stop();
      }
      return result;
    } catch (error) {
      if (showSpinner) {
        ux.action.stop('failed');
      }
      throw error;
    }
  }

  /**
   * Standardized error handling using this.error() with support for custom error suggestions.
   */
  protected handleError(error: unknown, verbose = false): never {
    if (error instanceof Error) {
      const message = error.message;
      const suggestions: string[] = [];

      if ('suggestions' in error && Array.isArray(error.suggestions)) {
        suggestions.push(...error.suggestions);
      }

      const options: { exit: number; code?: string; suggestions?: string[] } = {
        exit: 1,
      };

      if ('code' in error && typeof error.code === 'string') {
        options.code = error.code;
      }

      if (suggestions.length > 0) {
        options.suggestions = suggestions;
      }

      if (verbose && error.stack) {
        this.error(`${message}\n\n${error.stack}`, options);
      } else {
        this.error(message, options);
      }
    }

    this.error(String(error), { exit: 1 });
  }

  protected async getFlags(): Promise<{ json: boolean; verbose: boolean }> {
    return { json: false, verbose: false };
  }
}

export const paginationFlags = {
  limit: Flags.integer({
    char: 'l',
    description: 'Max results per request',
    default: 10,
  }),
  offset: Flags.integer({
    char: 'o',
    description: 'Number of results to skip',
    default: 0,
  }),
};
