import { describe, test, expect } from 'bun:test';
import {
  output,
  formatUser,
  formatSeasons,
  formatRank,
  formatSearchResults,
  formatActivities,
  formatXP,
} from '../../../src/lib/formatting/output.js';
import type { EthosUser, Season, Activity } from '../../../src/lib/api/echo-client.js';

// ============================================================================
// output() Tests
// ============================================================================

describe('output', () => {
  test('serializes object to JSON', () => {
    const data = { foo: 'bar', num: 42 };
    const result = output(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('handles arrays', () => {
    const data = [1, 2, 3, { name: 'test' }];
    const result = output(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('handles nested objects', () => {
    const data = {
      user: { name: 'Alice', profile: { score: 100 } },
      items: [1, 2, 3],
    };
    const result = output(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('handles null values', () => {
    const data = { value: null, other: 'test' };
    const result = output(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('handles empty objects', () => {
    const data = {};
    const result = output(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('handles empty arrays', () => {
    const data: unknown[] = [];
    const result = output(data);
    expect(JSON.parse(result)).toEqual(data);
  });

  test('handles strings', () => {
    const data = 'test string';
    const result = output(data);
    expect(JSON.parse(result)).toBe(data);
  });

  test('handles numbers', () => {
    const data = 42;
    const result = output(data);
    expect(JSON.parse(result)).toBe(data);
  });

  test('handles booleans', () => {
    const data = true;
    const result = output(data);
    expect(JSON.parse(result)).toBe(data);
  });

  test('formats with proper indentation', () => {
    const data = { a: 1 };
    const result = output(data);
    expect(result).toContain('  ');
  });
});

// ============================================================================
// formatUser() Tests
// ============================================================================

describe('formatUser', () => {
  const baseUser: EthosUser = {
    id: 1,
    profileId: 123,
    displayName: 'Test User',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.jpg',
    description: 'A test user',
    score: 1500,
    status: 'ACTIVE',
    userkeys: ['twitter:testuser', 'address:0x123'],
    xpTotal: 2500,
    xpStreakDays: 5,
    influenceFactor: 1.2,
    influenceFactorPercentile: 75,
    links: {
      profile: 'https://ethos.network/testuser',
      scoreBreakdown: 'https://ethos.network/testuser/score',
    },
    stats: {
      review: {
        received: { positive: 10, neutral: 2, negative: 1 },
      },
      vouch: {
        given: { amountWeiTotal: '1000000000000000000', count: 5 },
        received: { amountWeiTotal: '2000000000000000000', count: 8 },
      },
    },
  };

  test('formats complete user profile', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('Test User');
    expect(result).toContain('testuser');
    expect(result).toContain('1500');
    expect(result).toContain('2,500');
    expect(result).toContain('ACTIVE');
  });

  test('includes username when present', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('@testuser');
  });

  test('includes profile ID when present', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('123');
  });

  test('includes XP streak when greater than 0', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('5');
    expect(result).toContain('day');
  });

  test('pluralizes streak days correctly', () => {
    const userWithMultipleDays = { ...baseUser, xpStreakDays: 3 };
    const result = formatUser(userWithMultipleDays);
    expect(result).toContain('days');
  });

  test('omits streak when zero', () => {
    const userNoStreak = { ...baseUser, xpStreakDays: 0 };
    const result = formatUser(userNoStreak);
    expect(result).not.toContain('Streak');
  });

  test('includes stats when present', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('Stats');
    expect(result).toContain('Reviews Received');
    expect(result).toContain('Vouches');
  });

  test('includes profile link when present', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('https://ethos.network/testuser');
  });

  test('handles user without username', () => {
    const userNoUsername = { ...baseUser, username: null };
    const result = formatUser(userNoUsername);
    expect(result).toContain('Test User');
    expect(result).not.toContain('@');
  });

  test('handles user without stats', () => {
    const userNoStats = { ...baseUser, stats: undefined };
    const result = formatUser(userNoStats);
    expect(result).toContain('Test User');
    expect(result).not.toContain('Stats');
  });

  test('handles user without links', () => {
    const userNoLinks = { ...baseUser, links: undefined };
    const result = formatUser(userNoLinks);
    expect(result).toContain('Test User');
    expect(result).not.toContain('Profile: https');
  });

  test('uses displayName as primary identifier', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('Test User');
  });

  test('falls back to username when displayName missing', () => {
    const userNoDisplay = { ...baseUser, displayName: '' };
    const result = formatUser(userNoDisplay);
    expect(result).toContain('testuser');
  });

  test('uses Unknown when both displayName and username missing', () => {
    const userMinimal = { ...baseUser, displayName: '', username: null };
    const result = formatUser(userMinimal);
    expect(result).toContain('Unknown');
  });

  test('formats review stats correctly', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('10');
    expect(result).toContain('positive');
    expect(result).toContain('2');
    expect(result).toContain('neutral');
    expect(result).toContain('1');
    expect(result).toContain('negative');
  });

  test('omits reviews when count is zero', () => {
    const userNoReviews = {
      ...baseUser,
      stats: {
        ...baseUser.stats!,
        review: { received: { positive: 0, neutral: 0, negative: 0 } },
      },
    };
    const result = formatUser(userNoReviews);
    expect(result).not.toContain('Reviews Received');
  });

  test('includes vouches when present', () => {
    const result = formatUser(baseUser);
    expect(result).toContain('received');
    expect(result).toContain('given');
  });

  test('omits vouches when count is zero', () => {
    const userNoVouches = {
      ...baseUser,
      stats: {
        ...baseUser.stats!,
        vouch: {
          given: { amountWeiTotal: '0', count: 0 },
          received: { amountWeiTotal: '0', count: 0 },
        },
      },
    };
    const result = formatUser(userNoVouches);
    expect(result).not.toContain('Vouches');
  });

  test('formats XP with locale string', () => {
    const userLargeXp = { ...baseUser, xpTotal: 1000000 };
    const result = formatUser(userLargeXp);
    expect(result).toContain('1,000,000');
  });
});

// ============================================================================
// formatXP() Tests
// ============================================================================

describe('formatXP', () => {
  test('formats XP balance with total', () => {
    const data = { totalXp: 5000 };
    const result = formatXP(data);
    expect(result).toContain('XP Balance');
    expect(result).toContain('5,000');
  });

  test('includes username when provided', () => {
    const data = { totalXp: 5000, username: 'testuser' };
    const result = formatXP(data);
    expect(result).toContain('testuser');
  });

  test('includes userkey when username not provided', () => {
    const data = { totalXp: 5000, userkey: 'address:0x123' };
    const result = formatXP(data);
    expect(result).toContain('address:0x123');
  });

  test('prefers username over userkey', () => {
    const data = { totalXp: 5000, username: 'testuser', userkey: 'address:0x123' };
    const result = formatXP(data);
    expect(result).toContain('testuser');
    expect(result).not.toContain('address:0x123');
  });

  test('formats large XP with locale string', () => {
    const data = { totalXp: 1000000 };
    const result = formatXP(data);
    expect(result).toContain('1,000,000');
  });
});

// ============================================================================
// formatSeasons() Tests
// ============================================================================

describe('formatSeasons', () => {
  const baseSeason: Season = {
    id: 1,
    name: 'Season 1',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    week: 1,
  };

  test('formats seasons list', () => {
    const seasons = [baseSeason];
    const result = formatSeasons(seasons);
    expect(result).toContain('XP Seasons');
    expect(result).toContain('Season 1');
  });

  test('includes current season indicator', () => {
    const seasons = [baseSeason];
    const result = formatSeasons(seasons, baseSeason);
    expect(result).toContain('Current');
    expect(result).toContain('Week 1');
  });

  test('marks current season with asterisk', () => {
    const seasons = [baseSeason];
    const result = formatSeasons(seasons, baseSeason);
    expect(result).toContain('*');
  });

  test('handles empty seasons array', () => {
    const result = formatSeasons([]);
    expect(result).toContain('No seasons found');
  });

  test('handles null seasons', () => {
    const result = formatSeasons(null as any);
    expect(result).toContain('No seasons found');
  });

  test('formats start date', () => {
    const seasons = [baseSeason];
    const result = formatSeasons(seasons);
    expect(result).toContain('Start');
    expect(result).toContain('2024');
  });

  test('includes end date when present', () => {
    const seasons = [baseSeason];
    const result = formatSeasons(seasons);
    expect(result).toContain('End');
  });

  test('omits end date when not present', () => {
    const seasonNoEnd = { ...baseSeason, endDate: undefined };
    const result = formatSeasons([seasonNoEnd]);
    expect(result).not.toContain('End');
  });

  test('handles multiple seasons', () => {
    const season2 = { ...baseSeason, id: 2, startDate: '2024-04-01' };
    const result = formatSeasons([baseSeason, season2]);
    expect(result).toContain('Season 1');
    expect(result).toContain('Season 2');
  });

  test('defaults week to 1 when not provided', () => {
    const seasons = [{ ...baseSeason, week: undefined }];
    const result = formatSeasons(seasons, seasons[0]);
    expect(result).toContain('Week 1');
  });
});

// ============================================================================
// formatRank() Tests
// ============================================================================

describe('formatRank', () => {
  test('formats rank with position', () => {
    const data = { rank: 42 };
    const result = formatRank(data);
    expect(result).toContain('Leaderboard Rank');
    expect(result).toContain('#42');
  });

  test('includes total XP when provided', () => {
    const data = { rank: 42, totalXp: 5000 };
    const result = formatRank(data);
    expect(result).toContain('5,000');
  });

  test('includes username when provided', () => {
    const data = { rank: 42, username: 'testuser' };
    const result = formatRank(data);
    expect(result).toContain('testuser');
  });

  test('includes userkey when username not provided', () => {
    const data = { rank: 42, userkey: 'address:0x123' };
    const result = formatRank(data);
    expect(result).toContain('address:0x123');
  });

  test('prefers username over userkey', () => {
    const data = { rank: 42, username: 'testuser', userkey: 'address:0x123' };
    const result = formatRank(data);
    expect(result).toContain('testuser');
    expect(result).not.toContain('address:0x123');
  });

  test('formats large rank with locale string', () => {
    const data = { rank: 1000000 };
    const result = formatRank(data);
    expect(result).toContain('1,000,000');
  });

  test('formats large XP with locale string', () => {
    const data = { rank: 42, totalXp: 1000000 };
    const result = formatRank(data);
    expect(result).toContain('1,000,000');
  });
});

// ============================================================================
// formatSearchResults() Tests
// ============================================================================

describe('formatSearchResults', () => {
  const baseUser: EthosUser = {
    id: 1,
    profileId: 123,
    displayName: 'Test User',
    username: 'testuser',
    avatarUrl: null,
    description: null,
    score: 1500,
    status: 'ACTIVE',
    userkeys: [],
    xpTotal: 2500,
    xpStreakDays: 0,
    influenceFactor: 1.0,
    influenceFactorPercentile: 50,
  };

  test('formats search results', () => {
    const results = [baseUser];
    const result = formatSearchResults(results);
    expect(result).toContain('Search Results');
    expect(result).toContain('1 found');
    expect(result).toContain('Test User');
  });

  test('includes count of results', () => {
    const results = [baseUser, { ...baseUser, id: 2, displayName: 'User 2' }];
    const result = formatSearchResults(results);
    expect(result).toContain('2 found');
  });

  test('includes username for each result', () => {
    const results = [baseUser];
    const result = formatSearchResults(results);
    expect(result).toContain('@testuser');
  });

  test('includes score for each result', () => {
    const results = [baseUser];
    const result = formatSearchResults(results);
    expect(result).toContain('1500');
  });

  test('includes XP for each result', () => {
    const results = [baseUser];
    const result = formatSearchResults(results);
    expect(result).toContain('2,500');
  });

  test('handles empty results', () => {
    const result = formatSearchResults([]);
    expect(result).toContain('No users found');
  });

  test('handles null results', () => {
    const result = formatSearchResults(null as any);
    expect(result).toContain('No users found');
  });

  test('handles multiple results', () => {
    const results = [
      baseUser,
      { ...baseUser, id: 2, displayName: 'User 2', username: 'user2' },
      { ...baseUser, id: 3, displayName: 'User 3', username: 'user3' },
    ];
    const result = formatSearchResults(results);
    expect(result).toContain('3 found');
    expect(result).toContain('Test User');
    expect(result).toContain('User 2');
    expect(result).toContain('User 3');
  });

  test('handles user without username', () => {
    const userNoUsername = { ...baseUser, username: null };
    const result = formatSearchResults([userNoUsername]);
    expect(result).toContain('Test User');
  });

  test('uses Unknown when displayName and username missing', () => {
    const userMinimal = { ...baseUser, displayName: '', username: null };
    const result = formatSearchResults([userMinimal]);
    expect(result).toContain('Unknown');
  });

  test('formats XP with locale string', () => {
    const userLargeXp = { ...baseUser, xpTotal: 1000000 };
    const result = formatSearchResults([userLargeXp]);
    expect(result).toContain('1,000,000');
  });
});

// ============================================================================
// formatActivities() Tests
// ============================================================================

describe('formatActivities', () => {
  const baseActivity: Activity = {
    type: 'review',
    timestamp: 1704067200,
    data: {
      id: 1,
      comment: 'Great work!',
      score: 'positive',
      metadata: JSON.stringify({ description: 'Test metadata' }),
    },
    author: {
      userkey: 'twitter:author',
      profileId: 1,
      name: 'Author Name',
      username: 'author',
      avatar: null,
      score: 100,
    },
    subject: {
      userkey: 'twitter:subject',
      profileId: 2,
      name: 'Subject Name',
      username: 'subject',
      avatar: null,
      score: 200,
    },
    link: 'https://ethos.network/activity/1',
  };

  test('formats activity list', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('Recent Activity');
    expect(result).toContain('Review');
  });

  test('includes username in header when provided', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities, 'testuser');
    expect(result).toContain('testuser');
  });

  test('includes activity type icon', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('📝');
  });

  test('includes vouch icon for vouch activities', () => {
    const vouchActivity = { ...baseActivity, type: 'vouch' as const };
    const result = formatActivities([vouchActivity]);
    expect(result).toContain('🤝');
  });

  test('includes unvouch icon for unvouch activities', () => {
    const unvouchActivity = { ...baseActivity, type: 'unvouch' as const };
    const result = formatActivities([unvouchActivity]);
    expect(result).toContain('❌');
  });

  test('includes author and subject names', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('@author');
    expect(result).toContain('@subject');
  });

  test('includes comment when present', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('Great work!');
  });

  test('truncates long comments', () => {
    const longComment = 'a'.repeat(100);
    const activity = {
      ...baseActivity,
      data: { ...baseActivity.data, comment: longComment },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('...');
  });

  test('includes score when present', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('positive');
  });

  test('includes metadata description when present', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('Test metadata');
  });

  test('truncates long metadata descriptions', () => {
    const longDesc = 'a'.repeat(100);
    const activity = {
      ...baseActivity,
      data: {
        ...baseActivity.data,
        metadata: JSON.stringify({ description: longDesc }),
      },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('...');
  });

  test('handles empty activities array', () => {
    const result = formatActivities([]);
    expect(result).toContain('No activities found');
  });

  test('handles null activities', () => {
    const result = formatActivities(null as any);
    expect(result).toContain('No activities found');
  });

  test('handles multiple activities', () => {
    const activity2 = { ...baseActivity, data: { ...baseActivity.data, id: 2 } };
    const result = formatActivities([baseActivity, activity2]);
    expect(result).toContain('Review');
  });

  test('handles activity without comment', () => {
    const activity = {
      ...baseActivity,
      data: { ...baseActivity.data, comment: undefined },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('Review');
  });

  test('handles activity without score', () => {
    const activity = {
      ...baseActivity,
      data: { ...baseActivity.data, score: undefined },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('Review');
  });

  test('handles activity without metadata', () => {
    const activity = {
      ...baseActivity,
      data: { ...baseActivity.data, metadata: undefined },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('Review');
  });

  test('handles invalid metadata JSON', () => {
    const activity = {
      ...baseActivity,
      data: { ...baseActivity.data, metadata: 'invalid json' },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('Review');
  });

  test('uses author name when username not available', () => {
    const activity = {
      ...baseActivity,
      author: { ...baseActivity.author, username: null },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('Author Name');
  });

  test('uses subject name when username not available', () => {
    const activity = {
      ...baseActivity,
      subject: { ...baseActivity.subject, username: null },
    };
    const result = formatActivities([activity]);
    expect(result).toContain('Subject Name');
  });

  test('formats timestamp correctly', () => {
    const activities = [baseActivity];
    const result = formatActivities(activities);
    expect(result).toContain('Jan');
    expect(result).toContain('2024');
  });
});
