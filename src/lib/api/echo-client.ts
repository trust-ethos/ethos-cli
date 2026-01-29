/**
 * Lightweight Echo API client for Ethos CLI
 * Uses native fetch for minimal dependencies
 */

import { APIError, NetworkError, NotFoundError } from '../errors/cli-error.js';

const API_URLS = {
  dev: 'https://api.dev.ethos.network',
  staging: 'https://api.dev.ethos.network', // Using dev for staging until staging is available
  prod: 'https://api.ethos.network',
} as const;

type Environment = keyof typeof API_URLS;

export class EchoClient {
  private baseUrl: string;
  private debug: boolean;

  constructor(env?: Environment) {
    const environment = env || (process.env.ETHOS_ENV as Environment) || 'prod';
    this.baseUrl = process.env.ETHOS_API_URL || API_URLS[environment];
    this.debug = process.env.ETHOS_DEBUG === 'true' || process.env.DEBUG === 'ethos:*';
  }

  private log(message: string, data?: any): void {
    if (this.debug) {
      console.error(`[DEBUG] ${message}`, data || '');
    }
  }

  private async request<T>(path: string, resourceType?: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    this.log(`Fetching ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      this.log(`Response status: ${response.status}`);

      if (!response.ok) {
        // Handle 404 specifically
        if (response.status === 404) {
          const identifier = path.split('/').pop() || 'unknown';
          throw new NotFoundError(resourceType || 'Resource', decodeURIComponent(identifier));
        }

        // Try to parse error response
        let errorMessage = `API request failed with status ${response.status}`;
        let errorBody;

        try {
          errorBody = await response.json();
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }

        this.log('API Error', { status: response.status, body: errorBody });

        throw new APIError(errorMessage, response.status, errorBody);
      }

      const data = await response.json() as T;
      this.log('Response data', data);

      return data;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof NotFoundError || error instanceof APIError) {
        throw error;
      }

      // Network/connection errors
      if (error instanceof Error) {
        this.log('Network error', error.message);

        // Check for common network error patterns
        if (error.message.includes('fetch failed') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('ENOTFOUND')) {
          throw new NetworkError(
            `Cannot connect to API at ${this.baseUrl}`,
            url,
          );
        }

        throw new NetworkError(error.message, url);
      }

      throw error;
    }
  }

  async getUserByUsername(username: string) {
    // Single user lookup - uses singular /user/by/x/{accountIdOrUsername}
    return this.request(`/api/v2/user/by/x/${encodeURIComponent(username)}`, 'User');
  }

  async getUserByAddress(address: string) {
    // Single user lookup - uses singular /user/by/address/{address}
    return this.request(`/api/v2/user/by/address/${encodeURIComponent(address)}`, 'User');
  }

  async searchUsers(query: string, limit = 10) {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
    });
    return this.request(`/api/v2/users/search?${params}`, 'Users');
  }

  async getTotalXp(userkey: string) {
    return this.request(`/api/v2/xp/user/${encodeURIComponent(userkey)}`, 'XP Balance');
  }

  async getSeasons() {
    return this.request('/api/v2/xp/seasons', 'XP Seasons');
  }

  async getLeaderboardRank(userkey: string) {
    return this.request(`/api/v2/xp/user/${encodeURIComponent(userkey)}/leaderboard-rank`, 'Leaderboard Rank');
  }
}
