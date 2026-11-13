import { CLIError } from '../errors/cli-error.js';

const WEB_URLS: Record<string, string> = {
  'https://api.dev.ethos.network': 'https://dev.ethos.network',
  'https://api.ethos.network': 'https://app.ethos.network',
};

const LOCAL_WEB_URL = 'http://localhost:8082';

/** Maps the CLI's API URL to the web app that hosts `/cli/login`. */
export function getWebUrl(apiUrl: string): string {
  const normalized = apiUrl.replace(/\/+$/, '');
  const known = WEB_URLS[normalized];
  if (known) return known;

  const { hostname } = new URL(normalized);
  if (hostname === 'localhost' || hostname === '127.0.0.1') return LOCAL_WEB_URL;

  throw new CLIError(`No sign-in page is known for ${normalized}.`, 'UNKNOWN_WEB_URL', [
    'Use the production or dev API, or run: ethos login --no-browser',
  ]);
}

export function buildLoginUrl(webUrl: string, params: { host: string; port?: number; state?: string }): string {
  const query = new URLSearchParams();
  if (params.port !== undefined) query.set('port', String(params.port));
  if (params.state !== undefined) query.set('state', params.state);
  query.set('host', params.host);
  return `${webUrl}/cli/login?${query}`;
}
