import { mock } from 'bun:test';
import type { EthosUser, SearchResult, SeasonsResponse, Activity } from '../../src/lib/api/echo-client.js';

// Mock user data
export const mockUser: EthosUser = {
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

export const mockSearchResult: SearchResult = {
  values: [mockUser],
  total: 1,
  limit: 10,
  offset: 0,
};

export const mockSeasonsResponse: SeasonsResponse = {
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

export const mockActivities: Activity[] = [
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

// Mock API responses - success case
export function mockEchoClientSuccess() {
  return mock.module('../../src/lib/api/echo-client.js', () => ({
    EchoClient: class MockEchoClient {
      async resolveUser() {
        return mockUser;
      }

      async getUserByTwitter() {
        return mockUser;
      }

      async getUserByAddress() {
        return mockUser;
      }

      async getUserByProfileId() {
        return mockUser;
      }

      async searchUsers() {
        return mockSearchResult;
      }

      async getActivities() {
        return mockActivities;
      }

      async getLeaderboardRank() {
        return 42;
      }

      async getSeasons() {
        return mockSeasonsResponse;
      }

      async getXpTotal() {
        return 2500;
      }

      getPrimaryUserkey() {
        return 'profileId:456';
      }
    },
  }));
}

// Mock API responses - not found case
export function mockEchoClientNotFound() {
  return mock.module('../../src/lib/api/echo-client.js', () => ({
    EchoClient: class MockEchoClient {
      async resolveUser() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      async getUserByTwitter() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      async getUserByAddress() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      async getUserByProfileId() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      async searchUsers() {
        return { values: [], total: 0, limit: 10, offset: 0 };
      }

      async getActivities() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      async getLeaderboardRank() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      async getSeasons() {
        return mockSeasonsResponse;
      }

      async getXpTotal() {
        const error = new Error('User not found');
        (error as any).name = 'NotFoundError';
        throw error;
      }

      getPrimaryUserkey() {
        return null;
      }
    },
  }));
}

// Mock API responses - network error case
export function mockEchoClientNetworkError() {
  return mock.module('../../src/lib/api/echo-client.js', () => ({
    EchoClient: class MockEchoClient {
      async resolveUser() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getUserByTwitter() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getUserByAddress() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getUserByProfileId() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async searchUsers() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getActivities() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getLeaderboardRank() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getSeasons() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      async getXpTotal() {
        const error = new Error('Cannot connect to API');
        (error as any).name = 'NetworkError';
        throw error;
      }

      getPrimaryUserkey() {
        return null;
      }
    },
  }));
}
