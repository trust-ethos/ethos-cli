import { spawn } from 'node:child_process';

/** Opens a URL in the default browser. Resolves false if that fails. */
export function openUrl(url: string, platform: NodeJS.Platform = process.platform): Promise<boolean> {
  const [command, args] = launcherFor(url, platform);

  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
      child.once('error', () => resolve(false));
      child.once('exit', (code) => resolve(code === 0));
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
