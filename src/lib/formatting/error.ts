/**
 * Error formatting utilities for user-friendly error messages
 */

import pc from 'picocolors';
import { APIError, CLIError, NetworkError, NotFoundError, ValidationError } from '../errors/cli-error.js';

/**
 * Format an error for display to the user
 */
export function formatError(error: Error, verbose = false): string {
  const lines: string[] = [];

  // Error icon and message
  if (error instanceof NotFoundError) {
    lines.push(pc.yellow('⚠ ') + pc.bold(error.message));
  } else if (error instanceof NetworkError) {
    lines.push(pc.red('✖ ') + pc.bold('Network Error'));
    lines.push('  ' + error.message);
  } else if (error instanceof ValidationError) {
    lines.push(pc.yellow('⚠ ') + pc.bold('Validation Error'));
    lines.push('  ' + error.message);
  } else if (error instanceof APIError) {
    lines.push(pc.red('✖ ') + pc.bold('API Error'));
    lines.push('  ' + error.message);
    if (error.statusCode) {
      lines.push('  ' + pc.dim(`Status: ${error.statusCode}`));
    }
  } else {
    lines.push(pc.red('✖ ') + pc.bold('Error'));
    lines.push('  ' + error.message);
  }

  // Add suggestions if available
  if (error instanceof CLIError && error.suggestions.length > 0) {
    lines.push('');
    lines.push(pc.bold('Suggestions:'));
    for (const suggestion of error.suggestions) {
      lines.push('  • ' + pc.dim(suggestion));
    }
  }

  // Add verbose details if requested
  if (verbose) {
    lines.push('');
    lines.push(pc.dim('Debug Information:'));

    if (error instanceof NetworkError) {
      if (error.url) {
        lines.push(pc.dim(`  URL: ${error.url}`));
      }
      if (error.statusCode) {
        lines.push(pc.dim(`  Status Code: ${error.statusCode}`));
      }
    }

    if (error instanceof APIError) {
      if (error.response) {
        lines.push(pc.dim('  Response:'));
        lines.push(pc.dim('  ' + JSON.stringify(error.response, null, 2).replace(/\n/g, '\n  ')));
      }
    }

    if (error.stack) {
      lines.push(pc.dim('  Stack Trace:'));
      const stackLines = error.stack.split('\n').slice(1); // Skip first line (message)
      for (const line of stackLines) {
        lines.push(pc.dim('  ' + line.trim()));
      }
    }
  }

  // Add hint about verbose mode if not already verbose
  if (!verbose) {
    lines.push('');
    lines.push(pc.dim('Run with --verbose for more details'));
  }

  return lines.join('\n');
}
