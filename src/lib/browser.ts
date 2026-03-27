import { exec } from 'node:child_process';

/**
 * Open a URL in the default browser. Cross-platform.
 * Errors are silently ignored (user can manually visit the URL).
 */
export function openUrl(url: string): void {
  const platform = process.platform;

  let command: string;
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, () => {
    // Ignore errors — user can manually open the URL
  });
}
