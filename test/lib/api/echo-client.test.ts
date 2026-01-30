import { describe, expect, test, mock, beforeEach, afterEach } from 'bun:test';
import { EchoClient, type EthosUser, type SearchResult, type SeasonsResponse, type Activity } from '../../../src/lib/api/echo-client.js';
import { NotFoundError, NetworkError, APIError } from '../../../src/lib/errors/cli-error.js';

const originalFetch = globalThis.fetch;

function mockFetch<T>(fn: (...args: any[]) => Promise<T>): typeof fetch {
  return mock(fn) as unknown as typeof fetch;
}

const mockUser: EthosUser = {
  id: 123,
  profileId: 456,
  displayName: 'Test User',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.png',
  description: 'A test user',
  score: 1500,
  status: 'active',
  userkeys: ['address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'],
  xpTotal: 2500,
  xpStreakDays: 5,
  influenceFactor: 1.2,
  influenceFactorPercentile: 75,
  links: {
    profile: 'https://ethos.network/profile/testuser',
    scoreBreakdown: 'https://ethos.network/profile/testuser/score',
  },
  stats: {
    review: {
      received: { negative: 2, neutral: 3, positive: 10 },
    },
    vouch: {
      given: { amountWeiTotal: '1000000000000000000', count: 5 },
      received: { amountWeiTotal: '2000000000000000000', count: 8 },
    },
  },
};

const mockSearchResult: SearchResult = {
  values: [mockUser],
  total: 1,
  limit: 10,
  offset: 0,
};

const mockSeasonsResponse: SeasonsResponse = {
  seasons: [
    {
      id: 1,
      name: 'Season 1',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      week: 1,
    },
  ],
  currentSeason: {
    id: 1,
    name: 'Season 1',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    week: 1,
  },
};

const mockActivities: Activity[] = [
  {
    type: 'review',
    timestamp: 1704067200,
    data: {
      id: 1,
      comment: 'Great work!',
      score: 'positive',
    },
    author: {
      userkey: 'address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      profileId: 456,
      name: 'Test User',
      username: 'testuser',
      avatar: 'https://example.com/avatar.png',
      score: 1500,
    },
    subject: {
      userkey: 'address:0x1234567890123456789012345678901234567890',
      profileId: 789,
      name: 'Another User',
      username: 'anotheruser',
      avatar: 'https://example.com/avatar2.png',
      score: 2000,
    },
    link: 'https://ethos.network/review/1',
  },
];

describe('EchoClient', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('constructor', () => {
    test('creates client using config file', () => {
      const client = new EchoClient();
      expect(client).toBeDefined();
    });
  });

  describe('getUserByTwitter', () => {
    test('resolves Twitter username successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      ) as unknown as typeof fetch;

      const client = new EchoClient();
      const user = await client.getUserByTwitter('testuser');

      expect(user).toEqual(mockUser);
      expect(user.username).toBe('testuser');
      expect(user.score).toBe(1500);
    });

    test('encodes username in URL', async () => {
      let capturedUrl = '';
      globalThis.fetch = mockFetch((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response);
      }) as unknown as typeof fetch;

      const client = new EchoClient();
      await client.getUserByTwitter('test user');

      expect(capturedUrl).toContain('test%20user');
    });

    test('throws NotFoundError on 404', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('nonexistent');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).code).toBe('NOT_FOUND');
      }
    });

    test('throws APIError on 500', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve(JSON.stringify({ message: 'Internal Server Error' })),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('testuser');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).statusCode).toBe(500);
      }
    });

    test('throws NetworkError on fetch failure', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.reject(new Error('fetch failed'))
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('testuser');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
      }
    });
  });

  describe('getUserByAddress', () => {
    test('resolves ETH address successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.getUserByAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(user).toEqual(mockUser);
      expect(user.userkeys).toContain('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    });

    test('encodes address in URL', async () => {
      let capturedUrl = '';
      globalThis.fetch = mockFetch((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response);
      });

      const client = new EchoClient();
      await client.getUserByAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(capturedUrl).toContain('/by/address/');
    });

    test('throws NotFoundError on 404', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getUserByAddress('0x0000000000000000000000000000000000000000');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('getUserByProfileId', () => {
    test('resolves profile ID successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.getUserByProfileId('456');

      expect(user).toEqual(mockUser);
      expect(user.profileId).toBe(456);
    });

    test('throws NotFoundError on 404', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getUserByProfileId('999999');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('searchUsers', () => {
    test('returns search results successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSearchResult),
        } as Response)
      );

      const client = new EchoClient();
      const result = await client.searchUsers('vitalik');

      expect(result).toEqual(mockSearchResult);
      expect(result.values).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test('handles empty search results', async () => {
      const emptyResult: SearchResult = {
        values: [],
        total: 0,
        limit: 10,
        offset: 0,
      };

      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(emptyResult),
        } as Response)
      );

      const client = new EchoClient();
      const result = await client.searchUsers('nonexistent');

      expect(result.values).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('respects limit parameter', async () => {
      let capturedUrl = '';
      globalThis.fetch = mockFetch((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSearchResult),
        } as Response);
      });

      const client = new EchoClient();
      await client.searchUsers('test', 5);

      expect(capturedUrl).toContain('limit=5');
    });

    test('throws NetworkError on fetch failure', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.reject(new Error('ECONNREFUSED'))
      );

      const client = new EchoClient();
      try {
        await client.searchUsers('test');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
      }
    });
  });

  describe('resolveUser', () => {
    test('resolves Twitter username', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.resolveUser('testuser');

      expect(user).toEqual(mockUser);
    });

    test('resolves ETH address', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.resolveUser('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(user).toEqual(mockUser);
    });

    test('resolves ENS name via search', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSearchResult),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.resolveUser('vitalik.eth');

      expect(user).toEqual(mockUser);
    });

    test('resolves explicit address prefix', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.resolveUser('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(user).toEqual(mockUser);
    });

    test('resolves explicit profileId prefix', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.resolveUser('profileId:456');

      expect(user).toEqual(mockUser);
    });
  });

  describe('getXpTotal', () => {
    test('returns XP total successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(2500),
        } as Response)
      );

      const client = new EchoClient();
      const xp = await client.getXpTotal('profileId:456');

      expect(xp).toBe(2500);
    });

    test('throws NotFoundError on 404', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getXpTotal('profileId:999999');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('getSeasons', () => {
    test('returns seasons successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSeasonsResponse),
        } as Response)
      );

      const client = new EchoClient();
      const seasons = await client.getSeasons();

      expect(seasons).toEqual(mockSeasonsResponse);
      expect(seasons.seasons).toHaveLength(1);
      expect(seasons.currentSeason.name).toBe('Season 1');
    });

    test('throws NetworkError on fetch failure', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.reject(new Error('ENOTFOUND'))
      );

      const client = new EchoClient();
      try {
        await client.getSeasons();
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
      }
    });
  });

  describe('getLeaderboardRank', () => {
    test('returns leaderboard rank successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(42),
        } as Response)
      );

      const client = new EchoClient();
      const rank = await client.getLeaderboardRank('profileId:456');

      expect(rank).toBe(42);
    });

    test('throws NotFoundError on 404', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getLeaderboardRank('profileId:999999');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('getActivities', () => {
    test('returns activities successfully', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActivities),
        } as Response)
      );

      const client = new EchoClient();
      const activities = await client.getActivities('profileId:456');

      expect(activities).toEqual(mockActivities);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('review');
    });

    test('filters by activity type', async () => {
      let capturedUrl = '';
      globalThis.fetch = mockFetch((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActivities),
        } as Response);
      });

      const client = new EchoClient();
      await client.getActivities('profileId:456', ['review']);

      expect(capturedUrl).toContain('activityType=review');
    });

    test('respects limit parameter', async () => {
      let capturedUrl = '';
      globalThis.fetch = mockFetch((url: string) => {
        capturedUrl = url;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockActivities),
        } as Response);
      });

      const client = new EchoClient();
      await client.getActivities('profileId:456', ['review', 'vouch'], 5);

      expect(capturedUrl).toContain('limit=5');
    });

    test('throws NotFoundError on 404', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getActivities('profileId:999999');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });
  });

  describe('getPrimaryUserkey', () => {
    test('returns profileId userkey when available', () => {
      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(mockUser);

      expect(userkey).toBe('profileId:456');
    });

    test('returns address userkey when profileId unavailable', () => {
      const userWithoutProfileId: EthosUser = {
        ...mockUser,
        profileId: null,
      };

      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(userWithoutProfileId);

      expect(userkey).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    });

    test('returns first userkey when no profileId or address', () => {
      const userWithoutProfileId: EthosUser = {
        ...mockUser,
        profileId: null,
        userkeys: ['twitter:testuser'],
      };

      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(userWithoutProfileId);

      expect(userkey).toBe('twitter:testuser');
    });

    test('returns null when no userkeys available', () => {
      const userWithoutUserkeys: EthosUser = {
        ...mockUser,
        profileId: null,
        userkeys: [],
      };

      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(userWithoutUserkeys);

      expect(userkey).toBeNull();
    });
  });

  describe('timeout handling', () => {
    test('throws NetworkError on timeout', async () => {
      globalThis.fetch = mockFetch(() => {
        const error = new Error('Aborted');
        (error as any).name = 'AbortError';
        return Promise.reject(error);
      });

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('testuser');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).message).toContain('timed out');
      }
    });
  });

  describe('error handling', () => {
    test('handles API error with JSON response', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('test');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).message).toContain('Bad request');
      }
    });

    test('handles API error with text response', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.reject(new Error('Not JSON')),
          text: () => Promise.resolve('Plain text error'),
        } as Response)
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('test');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
      }
    });

    test('handles ECONNREFUSED network error', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.reject(new Error('ECONNREFUSED'))
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('test');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).message).toContain('Cannot connect');
      }
    });

    test('handles ENOTFOUND network error', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.reject(new Error('ENOTFOUND'))
      );

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('test');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).message).toContain('Cannot connect');
      }
    });
  });

  describe('deprecated methods', () => {
    test('getUserByUsername delegates to getUserByTwitter', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response)
      );

      const client = new EchoClient();
      const user = await client.getUserByUsername('testuser');

      expect(user).toEqual(mockUser);
    });

    test('getTotalXp delegates to getXpTotal', async () => {
      globalThis.fetch = mockFetch(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(2500),
        } as Response)
      );

      const client = new EchoClient();
      const xp = await client.getTotalXp('profileId:456');

      expect(xp).toBe(2500);
    });
  });

  describe('request headers', () => {
    test('sends Accept header', async () => {
      let capturedHeaders: HeadersInit | undefined;
      globalThis.fetch = mockFetch((_url: string, options?: RequestInit) => {
        capturedHeaders = options?.headers;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        } as Response);
      });

      const client = new EchoClient();
      await client.getUserByTwitter('testuser');

      expect(capturedHeaders).toBeDefined();
      const headersObj = capturedHeaders as Record<string, string>;
      expect(headersObj['Accept']).toBe('application/json');
    });
  });
});
