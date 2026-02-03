import { describe, expect, test, beforeEach, afterEach, spyOn, type Mock } from 'bun:test';
import { EchoClient, type EthosUser, type SearchResult, type SeasonsResponse, type Activity } from '../../../src/lib/api/echo-client.js';
import { NotFoundError, NetworkError, APIError } from '../../../src/lib/errors/cli-error.js';

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

function createMockResponse(data: unknown, options: { ok?: boolean; status?: number } = {}): Response {
  const { ok = true, status = 200 } = options;
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

describe('EchoClient', () => {
  let fetchSpy: Mock<typeof fetch>;

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('constructor', () => {
    test('creates client using config file', () => {
      const client = new EchoClient();
      expect(client).toBeDefined();
    });
  });

  describe('getUserByTwitter', () => {
    test('resolves Twitter username successfully', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.getUserByTwitter('testuser');

      expect(user).toEqual(mockUser);
      expect(user.username).toBe('testuser');
      expect(user.score).toBe(1500);
    });

    test('encodes username in URL', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      await client.getUserByTwitter('test user');

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('test%20user');
    });

    test('throws NotFoundError on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

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
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ message: 'Internal Server Error' })),
      } as Response);

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
      fetchSpy.mockRejectedValue(new Error('fetch failed'));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.getUserByAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(user).toEqual(mockUser);
      expect(user.userkeys).toContain('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    });

    test('encodes address in URL', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      await client.getUserByAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('/by/address/');
    });

    test('throws NotFoundError on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.getUserByProfileId('456');

      expect(user).toEqual(mockUser);
      expect(user.profileId).toBe(456);
    });

    test('throws NotFoundError on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockSearchResult));

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

      fetchSpy.mockResolvedValue(createMockResponse(emptyResult));

      const client = new EchoClient();
      const result = await client.searchUsers('nonexistent');

      expect(result.values).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    test('respects limit parameter', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockSearchResult));

      const client = new EchoClient();
      await client.searchUsers('test', 5);

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=5');
    });

    test('throws NetworkError on fetch failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.resolveUser('testuser');

      expect(user).toEqual(mockUser);
    });

    test('resolves ETH address', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.resolveUser('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(user).toEqual(mockUser);
    });

    test('resolves ENS name via search', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockSearchResult));

      const client = new EchoClient();
      const user = await client.resolveUser('vitalik.eth');

      expect(user).toEqual(mockUser);
    });

    test('resolves explicit address prefix', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.resolveUser('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');

      expect(user).toEqual(mockUser);
    });

    test('resolves explicit profileId prefix', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.resolveUser('profileId:456');

      expect(user).toEqual(mockUser);
    });
  });

  describe('getXpTotal', () => {
    test('returns XP total successfully', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(2500));

      const client = new EchoClient();
      const xp = await client.getXpTotal('profileId:456');

      expect(xp).toBe(2500);
    });

    test('throws NotFoundError on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockSeasonsResponse));

      const client = new EchoClient();
      const seasons = await client.getSeasons();

      expect(seasons).toEqual(mockSeasonsResponse);
      expect(seasons.seasons).toHaveLength(1);
      expect(seasons.currentSeason.name).toBe('Season 1');
    });

    test('throws NetworkError on fetch failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ENOTFOUND'));

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
      fetchSpy.mockResolvedValue(createMockResponse(42));

      const client = new EchoClient();
      const rank = await client.getLeaderboardRank('profileId:456');

      expect(rank).toBe(42);
    });

    test('throws NotFoundError on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockActivities));

      const client = new EchoClient();
      const activities = await client.getActivities('profileId:456');

      expect(activities).toEqual(mockActivities);
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('review');
    });

    test('filters by activity type', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockActivities));

      const client = new EchoClient();
      await client.getActivities('profileId:456', ['review']);

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('activityType=review');
    });

    test('respects limit parameter', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockActivities));

      const client = new EchoClient();
      await client.getActivities('profileId:456', ['review', 'vouch'], 5);

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain('limit=5');
    });

    test('throws NotFoundError on 404', async () => {
      fetchSpy.mockResolvedValue(createMockResponse({}, { ok: false, status: 404 }));

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
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      fetchSpy.mockRejectedValue(abortError);

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
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
      } as Response);

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
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error('Not JSON')),
        text: () => Promise.resolve('Plain text error'),
      } as Response);

      const client = new EchoClient();
      try {
        await client.getUserByTwitter('test');
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
      }
    });

    test('handles ECONNREFUSED network error', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

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
      fetchSpy.mockRejectedValue(new Error('ENOTFOUND'));

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
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      const user = await client.getUserByUsername('testuser');

      expect(user).toEqual(mockUser);
    });

    test('getTotalXp delegates to getXpTotal', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(2500));

      const client = new EchoClient();
      const xp = await client.getTotalXp('profileId:456');

      expect(xp).toBe(2500);
    });
  });

  describe('request headers', () => {
    test('sends Accept header', async () => {
      fetchSpy.mockResolvedValue(createMockResponse(mockUser));

      const client = new EchoClient();
      await client.getUserByTwitter('testuser');

      expect(fetchSpy).toHaveBeenCalled();
      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
      const headers = calledOptions?.headers as Record<string, string>;
      expect(headers['Accept']).toBe('application/json');
    });
  });
});
