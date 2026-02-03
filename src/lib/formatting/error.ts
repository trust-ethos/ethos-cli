import pc from 'picocolors';

import { APIError, CLIError, NetworkError, NotFoundError, ValidationError } from '../errors/cli-error.js';

export function formatError(error: Error, verbose = false): string {
  const lines: string[] = [];

  if (error instanceof NotFoundError) {
    lines.push(pc.yellow('⚠ ') + pc.bold(error.message));
  } else if (error instanceof NetworkError) {
    lines.push(pc.red('✖ ') + pc.bold('Network Error'), '  ' + error.message);
  } else if (error instanceof ValidationError) {
    lines.push(pc.yellow('⚠ ') + pc.bold('Validation Error'), '  ' + error.message);
  } else if (error instanceof APIError) {
    lines.push(pc.red('✖ ') + pc.bold('API Error'), '  ' + error.message);
    if (error.statusCode) {
      lines.push('  ' + pc.dim(`Status: ${error.statusCode}`));
    }
  } else {
    lines.push(pc.red('✖ ') + pc.bold('Error'), '  ' + error.message);
  }

  if (error instanceof CLIError && error.suggestions.length > 0) {
    lines.push('');
    for (const suggestion of error.suggestions) {
      if (suggestion.startsWith('Try:')) {
        lines.push(pc.cyan('💡 ' + suggestion));
      } else {
        lines.push(pc.dim('• ' + suggestion));
      }
    }
  }

  if (verbose) {
    lines.push('', pc.dim('Debug Information:'));

    if (error instanceof NetworkError) {
      if (error.url) lines.push(pc.dim(`  URL: ${error.url}`));
      if (error.statusCode) lines.push(pc.dim(`  Status Code: ${error.statusCode}`));
    }

    if (error instanceof APIError && error.response) {
      lines.push(
        pc.dim('  Response:'),
        pc.dim('  ' + JSON.stringify(error.response, null, 2).replaceAll('\n', '\n  '))
      );
    }

    if (error.stack) {
      lines.push(pc.dim('  Stack Trace:'));
      const stackLines = error.stack.split('\n').slice(1);
      for (const line of stackLines) {
        lines.push(pc.dim('  ' + line.trim()));
      }
    }
  }

  if (!verbose && !(error instanceof NotFoundError)) {
    lines.push('', pc.dim('Run with --verbose for more details'));
  }

  return lines.join('\n');
}
