import { spawn } from 'node:child_process';

/** Opens a URL in the default browser. Resolves false if that fails. */
export function openUrl(url: string, platform: NodeJS.Platform = process.platform): Promise<boolean> {
  return startDetached(...launcherFor(url, platform));
}

/**
 * Resolves true once the command has started, false if it could not start. Its exit is not
 * awaited, since xdg-open can keep running for as long as the browser it opened.
 */
export function startDetached(command: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
      child.once('error', () => resolve(false));
      child.once('spawn', () => {
        child.unref();
        resolve(true);
      });
    } catch {
      resolve(false);
    }
  });
}

export function launcherFor(url: string, platform: NodeJS.Platform): [string, string[]] {
  if (platform === 'darwin') return ['open', [url]];
  // `start` is a cmd builtin; its first quoted argument is a window title, and & must be escaped.
  if (platform === 'win32') return ['cmd', ['/c', 'start', '""', url.replaceAll('&', '^&')]];
  return ['xdg-open', [url]];
}
