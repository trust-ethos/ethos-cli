import { describe, expect, test } from 'bun:test';
import { EchoClient, type EthosUser } from '../../../src/lib/api/echo-client.js';

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

describe('EchoClient', () => {
  describe('constructor', () => {
    test('creates client using config file', () => {
      const client = new EchoClient();
      expect(client).toBeDefined();
    });


  });

  describe('getPrimaryUserkey', () => {
    test('returns profileId userkey when available', () => {
      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(mockUser);

      expect(userkey).toBe('profileId:456');
    });

    test('returns address userkey when profileId is null', () => {
      const userWithoutProfileId: EthosUser = {
        ...mockUser,
        profileId: null,
      };

      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(userWithoutProfileId);

      expect(userkey).toBe('address:0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    });

    test('returns first userkey when no profileId and no address userkey', () => {
      const userWithTwitterOnly: EthosUser = {
        ...mockUser,
        profileId: null,
        userkeys: ['twitter:testuser'],
      };

      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(userWithTwitterOnly);

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

    test('prefers profileId over address userkey', () => {
      const userWithBoth: EthosUser = {
        ...mockUser,
        profileId: 789,
        userkeys: ['address:0x1234567890123456789012345678901234567890', 'twitter:user'],
      };

      const client = new EchoClient();
      const userkey = client.getPrimaryUserkey(userWithBoth);

      expect(userkey).toBe('profileId:789');
    });
  });
});
