import { loadConfig } from '../config/index.js';
import { APIError, NetworkError, NotFoundError } from '../errors/cli-error.js';
import { type ParsedIdentifier, parseIdentifier } from '../validation/userkey.js';

export interface EthosUser {
  avatarUrl: null | string;
  description: null | string;
  displayName: string;
  id: number;
  influenceFactor: number;
  influenceFactorPercentile: number;
  links?: {
    profile: string;
    scoreBreakdown: string;
  };
  profileId: null | number;
  score: number;
  stats?: {
    review: {
      received: { negative: number; neutral: number; positive: number };
    };
    vouch: {
      given: { amountWeiTotal: string; count: number };
      received: { amountWeiTotal: string; count: number };
    };
  };
  status: string;
  userkeys: string[];
  username: null | string;
  xpStreakDays: number;
  xpTotal: number;
}

export interface SearchResult {
  limit: number;
  offset: number;
  total: number;
  values: EthosUser[];
}

export interface Season {
  endDate?: string;
  id: number;
  name: string;
  startDate: string;
  week?: number;
}

export interface SeasonsResponse {
  currentSeason: Season;
  seasons: Season[];
}

export interface ActivityAuthor {
  avatar: null | string;
  name: string;
  profileId: null | number;
  score: number;
  userkey: string;
  username: null | string;
}

export interface Activity {
  author: ActivityAuthor;
  data: {
    comment?: string;
    id: number;
    metadata?: string;
    score?: 'negative' | 'neutral' | 'positive';
  };
  link: string;
  subject: ActivityAuthor;
  timestamp: number;
  type: 'review' | 'unvouch' | 'vouch';
}

export type ActivityType = 'review' | 'vouch';

export interface Review {
  author: ActivityAuthor;
  authorUser?: EthosUser;
  data: {
    archived: boolean;
    author: string;
    authorProfileId: number;
    comment: string;
    createdAt: number;
    id: number;
    metadata: string;
    score: 'negative' | 'neutral' | 'positive';
    subject: string;
  };
  link: string;
  replySummary: { count: number; participated: boolean };
  subject: ActivityAuthor;
  subjectUser?: EthosUser;
  timestamp: number;
  type: 'review';
  votes: { downvotes: number; upvotes: number; };
}

export interface Slash {
  amount: number;
  attestationDetails?: {
    account: string;
    service: string;
  };
  authorProfileId: number;
  cancelledAt: number;
  closedAt: number;
  comment: string;
  createdAt: number;
  duration: number;
  id: number;
  metadata?: string;
  slashType: string;
  subject: null | number;
}

export interface SlashesResponse {
  data: {
    limit: number;
    offset: number;
    total: number;
    values: Slash[];
  };
  ok: boolean;
}

export type BrokerPostType = 'BOUNTY' | 'BUY' | 'FOR_HIRE' | 'HIRE' | 'SELL';
export type BrokerPostLevel = 'BASIC' | 'PREMIUM';
export type BrokerPostStatus = 'CLOSED' | 'COMPLETED' | 'EXPIRED' | 'OPEN';
export type BrokerSortBy = 'expiresAt' | 'hot' | 'newest' | 'score' | 'top';

export interface BrokerPostAuthor {
  avatarUrl?: string;
  displayName?: string;
  profileId: number;
  score: number;
  username?: string;
}

export interface BrokerPost {
  author: BrokerPostAuthor;
  createdAt: string;
  description: string;
  expiresAt: null | string;
  id: number;
  level: BrokerPostLevel;
  replyCount: number;
  status: BrokerPostStatus;
  tags: string[];
  title: string;
  type: BrokerPostType;
  votes: { downvotes: number; upvotes: number; };
}

export interface BrokerListParams {
  limit?: number;
  minScore?: number;
  offset?: number;
  search?: string;
  sortBy?: BrokerSortBy;
  type?: BrokerPostType;
}

export interface BrokerListResponse {
  limit: number;
  offset: number;
  total: number;
  values: BrokerPost[];
}

export interface ProjectChain {
  id: number;
  logoUrl?: string;
  name: string;
}

export interface ProjectVotes {
  all: { totalVoters: number; totalVotes: number };
  bearish: { percentage: number; total: number; };
  bullish: { percentage: number; total: number; };
}

export interface Project {
  bannerImageUrl?: string;
  categories?: string[];
  chains?: ProjectChain[];
  createdAt: string;
  description: string;
  id: number;
  isPromoted?: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING';
  updatedAt: string;
  user: EthosUser;
  userkey: string;
  votes?: ProjectVotes;
}

export interface ProjectVoter {
  bearishCount: number;
  bearishReasons: string[];
  bullishCount: number;
  bullishReasons: string[];
  firstVoteAt: string;
  lastVoteAt: string;
  totalVotes: number;
  user: EthosUser;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface ProjectVotersTotals {
  totalBearishVoters: number;
  totalBearishVotes: number;
  totalBullishVoters: number;
  totalBullishVotes: number;
  totalVoters: number;
}

export interface ProjectVotersResponse {
  limit: number;
  offset: number;
  total: number;
  totals: ProjectVotersTotals;
  values: ProjectVoter[];
}

export interface MarketUser {
  avatarUrl: null | string;
  displayName: string;
  profileId: number;
  score: number;
  username: null | string;
}

export interface MarketStats {
  marketCapChange24hPercent?: number;
  marketCapChange24hWei?: string;
  marketCapWei: string;
  priceChange24hPercent?: number;
  volume24hWei?: string;
  volumeTotalWei: string;
}

export interface Market {
  basePrice: string;
  createdAt: string;
  creatorAddress: string;
  distrustVotes: number;
  id: number;
  negativePrice: string;
  positivePrice: string;
  stats: MarketStats;
  trustVotes: number;
  updatedAt: string;
  user: MarketUser;
}

export interface MarketHolder {
  actorAddress: string;
  marketId: number;
  total: string;
  user: MarketUser;
  voteType: 'distrust' | 'trust';
}

export type MarketOrderBy = 'createdAt' | 'distrustRatio' | 'marketCapChange24hPercent' | 'marketCapWei' | 'priceChange24hPercent' | 'score' | 'scoreDifferential' | 'trustRatio' | 'volume24hWei' | 'volumeTotalWei';

export interface MarketListParams {
  filterQuery?: string;
  limit?: number;
  offset?: number;
  orderBy?: MarketOrderBy;
  orderDirection?: 'asc' | 'desc';
}

export interface MarketListResponse {
  limit: number;
  offset: number;
  total: number;
  values: Market[];
}

export interface FeaturedMarket {
  market: Market;
  type: 'rugging' | 'top-volume' | 'undervalued' | string;
}

export type FeaturedMarketsResponse = FeaturedMarket[];

export interface MarketHoldersResponse {
  total: number;
  values: MarketHolder[];
}

export interface MarketUserByTwitter {
  avatarUrl: string;
  profileId: number;
  twitterName: string;
  twitterUserId: string;
  twitterUsername: string;
  walletAddress: string;
}

export interface NFT {
  contractAddress: string;
  contractName?: string;
  description?: string;
  imageUrl: null | string;
  name: null | string;
  tokenId: string;
}

export interface NftsResponse {
  limit?: number;
  offset?: number;
  total: number;
  values: NFT[];
}

export interface ValidatorListing {
  currency: string;
  imageUrl: null | string;
  name: null | string;
  openseaUrl: string;
  orderHash: string;
  priceEth: string;
  priceWei: string;
  seller: string;
  tokenId: string;
}

export interface ValidatorListingsResponse {
  limit?: number;
  offset?: number;
  total: number;
  values: ValidatorListing[];
}

export interface AuctionBuyer {
  displayName?: string;
  username?: null | string;
}

export interface Auction {
  buyerAddress: null | string;
  buyerUser?: AuctionBuyer | null;
  createdAt: string;
  creatorAddress: string;
  duration: number;
  id: number;
  nftContract: string;
  nftTokenId: number;
  pricePaid: null | string;  // wei
  reservePrice: string;  // wei
  soldTime: null | string;
  startPrice: string;  // wei
  startTime: string;
  status: 'ENABLED' | 'ENDED' | 'PENDING' | 'SOLD';
}

export interface AuctionsResponse {
  total: number;
  values: Auction[];
}

export interface Invitation {
  dateAccepted: null | string;
  dateInvited: string;
  id: number;
  recipientAddress: string;
  recipientScoreImpact: { impact: string; value: number; };
  senderProfileId: number;
  senderScoreImpact: { impact: string; value: number; };
  status: 'ACCEPTED' | 'INVITED';
}

export interface InvitationWithUser {
  invitation: Invitation;
  invitedUser: EthosUser;
}

export interface InvitationsResponse {
  limit: number;
  offset: number;
  total: number;
  values: InvitationWithUser[];
}

export interface Validator {
  currentXp: number;
  imageUrl: string;
  isFull: boolean;
  name: string;
  ownerAddress: string;
  ownerAvatarUrl: null | string;
  ownerDisplayName: string;
  ownerProfileId: number;
  ownerUsername: null | string;
  remainingCapacity: number;
  tokenId: string;
  xpCap: number;
}

export type ScoreLevel = 'exemplary' | 'neutral' | 'questionable' | 'reputable' | 'untrusted';

export interface ScoreResponse {
  level: ScoreLevel;
  score: number;
}

export interface ScoreBreakdownElement {
  element: {
    name: string;
    range?: { max: number; min: number; };
    type: string;
  };
  error: boolean;
  raw: number;
  weighted: number;
}

export interface ScoreBreakdownResponse {
  data: {
    elements: Record<string, ScoreBreakdownElement>;
    errors: string[];
    metadata: Record<string, unknown>;
    score: number;
  };
  ok: boolean;
}

export interface ScoreStatus {
  isCalculating: boolean;
  isPending: boolean;
  isQueued: boolean;
  status: 'calculating' | 'idle' | 'queued';
}

// Vouch types
export interface VouchUser {
  avatarUrl?: null | string;
  displayName?: string;
  id?: number;
  profileId?: null | number;
  score?: number;
  userkeys?: string[];
  username?: null | string;
}

export interface Vouch {
  activityCheckpoints: {
    unhealthyAt: number;
    unvouchedAt: number;
    vouchedAt: number;
  };
  archived: boolean;
  attestationDetails?: null | {
    account: string;
    service: string;
  };
  authorAddress: string;
  authorProfileId: number;
  authorUser?: null | VouchUser;
  balance: string;  // bigint as string
  comment: string;
  deposited: string;
  id: number;
  metadata: string;
  mutualId: null | number;
  staked: string;
  subjectAddress: null | string;
  subjectProfileId: number;
  subjectUser?: null | VouchUser;
  unhealthy: boolean;
  withdrawn: string;
}

export interface VouchesResponse {
  limit: number;
  offset: number;
  total: number;
  values: Vouch[];
}

export interface VouchQueryParams {
  archived?: boolean;
  authorProfileIds?: number[];
  ids?: number[];
  limit?: number;
  offset?: number;
  subjectProfileIds?: number[];
  subjectUserkeys?: string[];
}

// Vote types
export type VoteType = 'review' | 'slash' | 'vouch';

export interface VoteUser {
  avatarUrl: null | string;
  displayName: string;
  id: number;
  profileId: number;
  score: number;
  username: null | string;
}

export interface Vote {
  createdAt: number;
  isArchived: boolean;
  isUpvote: boolean;
  targetContract: string;
  targetId: string;
  user: VoteUser;
  voter: number;
  weight: number;
}

export interface VotesResponse {
  limit: number;
  offset: number;
  total: number;
  values: Vote[];
}

export interface VoteStats {
  counts: {
    downvotes: number;
    upvotes: number;
  };
  userVote: null | { isUpvote: boolean };
  weights: {
    downvotePercentage: number;
    upvotePercentage: number;
    weightedDownvotes: number;
    weightedUpvotes: number;
  };
}

export class EchoClient {
  private baseUrl: string;
  private debug: boolean;

  constructor() {
    const config = loadConfig();
    this.baseUrl = config.apiUrl;
    this.debug = process.env.DEBUG === 'ethos:*';
  }

  async checkValidatorOwnership(userkey: string): Promise<NFT[]> {
     return this.request<NFT[]>(`/api/v2/nfts/user/${encodeURIComponent(userkey)}/owns-validator`, 'Validator Check');
   }

   convertScoreToLevel(score: number): ScoreLevel {
    if (score < 800) return 'untrusted';
    if (score < 1200) return 'questionable';
    if (score < 1600) return 'neutral';
    if (score < 2000) return 'reputable';
    return 'exemplary';
  }

  async getActiveAuction(): Promise<Auction | null> {
      return this.request<Auction | null>('/api/v2/auctions/active', 'Active Auction');
    }

  async getActivities(userkey: string, types: ActivityType[] = ['review', 'vouch'], limit = 10): Promise<Activity[]> {
    const params = new URLSearchParams({ limit: String(limit), userkey });
    for (const type of types) {
      params.append('activityType', type);
    }

    return this.request<Activity[]>(`/api/v2/activities/userkey?${params}`, 'Activities');
  }

  async getAuction(auctionId: number): Promise<Auction> {
      return this.request<Auction>(`/api/v2/auctions/${auctionId}`, 'Auction');
    }

  async getAuctions(params: { limit?: number; offset?: number; status?: string } = {}): Promise<AuctionsResponse> {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      if (params.status) query.set('status', params.status);
      const path = `/api/v2/auctions${query.toString() ? '?' + query.toString() : ''}`;
      return this.request<AuctionsResponse>(path, 'Auctions');
    }

  async getBrokerPost(id: number): Promise<BrokerPost> {
    return this.request<BrokerPost>(`/api/v2/broker/posts/${id}`, 'Broker Post');
  }

  async getBrokerPosts(params: BrokerListParams = {}): Promise<BrokerListResponse> {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.minScore) query.set('minScore', String(params.minScore));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    const path = `/api/v2/broker/posts${query.toString() ? '?' + query.toString() : ''}`;
    return this.request<BrokerListResponse>(path, 'Broker Posts');
  }

  async getBrokerPostsByAuthor(profileId: number, params: { limit?: number; type?: BrokerPostType; } = {}): Promise<BrokerListResponse> {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.limit) query.set('limit', String(params.limit));
    const path = `/api/v2/broker/author/${profileId}/posts${query.toString() ? '?' + query.toString() : ''}`;
    return this.request<BrokerListResponse>(path, 'Author Posts');
  }

  async getFeaturedMarkets(): Promise<FeaturedMarketsResponse> {
    return this.request<FeaturedMarketsResponse>('/api/v2/markets/featured', 'Featured Markets');
  }

  async getInvitations(params: { limit?: number; offset?: number; senderProfileId?: number; status?: 'ACCEPTED' | 'INVITED'; } = {}): Promise<InvitationsResponse> {
    const query = new URLSearchParams();
    if (params.senderProfileId) query.set('senderProfileId', String(params.senderProfileId));
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    return this.request<InvitationsResponse>(`/api/v2/invitations${query.toString() ? '?' + query.toString() : ''}`, 'Invitations');
  }

  async getLeaderboardRank(userkey: string): Promise<number> {
    return this.request<number>(`/api/v2/xp/user/${encodeURIComponent(userkey)}/leaderboard-rank`, 'Leaderboard Rank');
  }

  async getMarketByTwitter(username: string): Promise<MarketUserByTwitter> {
    return this.request<MarketUserByTwitter>(`/api/v2/markets/users/by/x/${encodeURIComponent(username)}`, 'Market User');
  }

  async getMarketHolders(profileId: number, params: { limit?: number } = {}): Promise<MarketHoldersResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<MarketHoldersResponse>(`/api/v2/markets/${profileId}/holders${query.toString() ? '?' + query.toString() : ''}`, 'Market Holders');
  }

  async getMarketInfo(profileId: number): Promise<Market> {
    return this.request<Market>(`/api/v2/markets/${profileId}/info`, 'Market Info', {
      body: JSON.stringify({ includeMarketChange: true, includeTopHolders: true, profileId }),
      method: 'POST',
    });
  }

  async getMarkets(params: MarketListParams = {}): Promise<MarketListResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    if (params.orderBy) query.set('orderBy', params.orderBy);
    if (params.orderDirection) query.set('orderDirection', params.orderDirection);
    if (params.filterQuery) query.set('filterQuery', params.filterQuery);
    return this.request<MarketListResponse>(`/api/v2/markets${query.toString() ? '?' + query.toString() : ''}`, 'Markets');
  }

   async getMutualVouchers(viewerProfileId: number, targetProfileId: number, params: { limit?: number } = {}): Promise<{ total: number; values: VouchUser[]; }> {
    const query = new URLSearchParams();
    query.set('viewerProfileId', String(viewerProfileId));
    query.set('targetProfileId', String(targetProfileId));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ total: number; values: VouchUser[]; }>(`/api/v2/vouches/mutual-vouchers?${query}`, 'Mutual Vouchers');
  }

   async getNftsForUser(userkey: string, params: { limit?: number; offset?: number } = {}): Promise<NftsResponse> {
     const query = new URLSearchParams();
     if (params.limit) query.set('limit', String(params.limit));
     if (params.offset) query.set('offset', String(params.offset));
     const path = `/api/v2/nfts/user/${encodeURIComponent(userkey)}${query.toString() ? '?' + query.toString() : ''}`;
     return this.request<NftsResponse>(path, 'User NFTs');
   }

   getPrimaryUserkey(user: EthosUser): null | string {
    if (user.profileId) {
      return `profileId:${user.profileId}`;
    }
    
    const addressKey = user.userkeys?.find(uk => uk.startsWith('address:'));
    if (addressKey) return addressKey;
    
    return user.userkeys?.[0] || null;
  }

  async getProjectByUsername(username: string): Promise<Project> {
    return this.request<Project>(`/api/v2/projects/username/${encodeURIComponent(username)}`, 'Project');
  }

  async getProjectDetails(projectId: number): Promise<Project> {
    return this.request<Project>(`/api/v2/projects/${projectId}/details`, 'Project');
  }

  async getProjects(params: { limit?: number; offset?: number; status?: string[]; } = {}): Promise<ProjectListResponse> {
    const query = new URLSearchParams();
    if (params.status) for (const s of params.status) query.append('status[]', s);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    return this.request<ProjectListResponse>(`/api/v2/projects${query.toString() ? '?' + query.toString() : ''}`, 'Projects');
  }

  async getProjectTeam(projectId: number): Promise<EthosUser[]> {
     return this.request<EthosUser[]>(`/api/v2/projects/${projectId}/team`, 'Team');
   }

  async getProjectVoters(projectId: number, params: { limit?: number; offset?: number; sentiment?: 'bearish' | 'bullish' } = {}): Promise<ProjectVotersResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    if (params.sentiment) query.set('sentiment', params.sentiment);
    return this.request<ProjectVotersResponse>(`/api/v2/projects/${projectId}/voters${query.toString() ? '?' + query.toString() : ''}`, 'Voters');
  }

  async getReview(reviewId: number): Promise<Review> {
    return this.request<Review>(`/api/v2/activities/review/${reviewId}`, 'Review');
  }

  async getReviewsForUser(userkey: string, params: { limit?: number; offset?: number } = {}): Promise<Activity[]> {
    const query = new URLSearchParams({ userkey });
    query.append('activityType', 'review');
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    return this.request<Activity[]>(`/api/v2/activities/userkey?${query}`, 'Reviews');
  }

   async getScoreBreakdownByAddress(address: string): Promise<ScoreBreakdownResponse> {
    const params = new URLSearchParams({ address });
    return this.request<ScoreBreakdownResponse>(`/api/v1/score/address?${params}`, 'Score');
  }

   async getScoreBreakdownByUserkey(userkey: string): Promise<ScoreBreakdownResponse> {
    const params = new URLSearchParams({ userkey });
    return this.request<ScoreBreakdownResponse>(`/api/v1/score/userkey?${params}`, 'Score');
  }

   async getScoreStatus(userkey: string): Promise<ScoreStatus> {
    const params = new URLSearchParams({ userkey });
    return this.request<ScoreStatus>(`/api/v2/score/status?${params}`, 'Score Status');
  }

    async getSeasons(): Promise<SeasonsResponse> {
    return this.request<SeasonsResponse>('/api/v2/xp/seasons', 'XP Seasons');
  }

    async getSlashes(params: { author?: string; limit?: number; offset?: number; status?: 'closed' | 'open'; subject?: string; } = {}): Promise<SlashesResponse> {
     const query = new URLSearchParams();
     if (params.author) query.set('author', params.author);
     if (params.subject) query.set('subject', params.subject);
     if (params.status) query.set('status', params.status);
     if (params.limit) query.set('limit', String(params.limit));
     if (params.offset) query.set('offset', String(params.offset));
     const path = `/api/v1/slashes${query.toString() ? '?' + query.toString() : ''}`;
     return this.request<SlashesResponse>(path, 'Slashes');
   }

    async getSlashRoles(slashId: number, profileIds: number[]): Promise<Record<number, string>> {
     const query = new URLSearchParams();
     for (const id of profileIds) query.append('profileId', String(id));
     return this.request<Record<number, string>>(`/api/v1/slashes/${slashId}/roles?${query.toString()}`, 'Slash Roles');
   }

    /** @deprecated Use getXpTotal instead */
   async getTotalXp(userkey: string): Promise<number> {
     return this.getXpTotal(userkey);
   }

  async getUserByAddress(address: string): Promise<EthosUser> {
    return this.request<EthosUser>(`/api/v2/user/by/address/${encodeURIComponent(address)}`, 'User');
  }

  async getUserByProfileId(profileId: string): Promise<EthosUser> {
    return this.request<EthosUser>(`/api/v2/user/by/profile-id/${encodeURIComponent(profileId)}`, 'User');
  }

  async getUserByTwitter(username: string): Promise<EthosUser> {
    return this.request<EthosUser>(`/api/v2/user/by/x/${encodeURIComponent(username)}`, 'User');
  }

  /** @deprecated Use resolveUser instead */
  async getUserByUsername(username: string): Promise<EthosUser> {
    return this.getUserByTwitter(username);
  }

  async getValidatorByTokenId(tokenId: string): Promise<null | Validator> {
    const validators = await this.getValidators();
    return validators.find(v => v.tokenId === tokenId) || null;
  }

  async getValidatorListings(params: { limit?: number; offset?: number } = {}): Promise<ValidatorListingsResponse> {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      const path = `/api/v2/nfts/validators/listings${query.toString() ? '?' + query.toString() : ''}`;
      return this.request<ValidatorListingsResponse>(path, 'Validator Listings');
    }

  async getValidators(): Promise<Validator[]> {
    return this.request<Validator[]>('/api/v2/xp/validators', 'Validators');
  }

  async getVotes(activityId: number, type: VoteType, params: { isUpvote?: boolean; limit?: number; offset?: number } = {}): Promise<VotesResponse> {
    const query = new URLSearchParams();
    query.set('activityId', String(activityId));
    query.set('type', type);
    if (params.isUpvote !== undefined) query.set('isUpvote', String(params.isUpvote));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    return this.request<VotesResponse>(`/api/v2/votes?${query}`, 'Votes');
  }

  async getVoteStats(activityId: number, type: VoteType): Promise<VoteStats> {
    const query = new URLSearchParams();
    query.set('activityId', String(activityId));
    query.set('type', type);
    return this.request<VoteStats>(`/api/v2/votes/stats?${query}`, 'Vote Stats');
  }

  async getVouches(params: VouchQueryParams = {}): Promise<VouchesResponse> {
    const body: Record<string, unknown> = {};
    if (params.ids) body.ids = params.ids;
    if (params.subjectUserkeys) body.subjectUserkeys = params.subjectUserkeys;
    if (params.authorProfileIds) body.authorProfileIds = params.authorProfileIds;
    if (params.subjectProfileIds) body.subjectProfileIds = params.subjectProfileIds;
    if (params.archived !== undefined) body.archived = params.archived;
    if (params.limit) body.limit = params.limit;
    if (params.offset) body.offset = params.offset;

    const response = await this.request<{ data: VouchesResponse; ok: boolean; }>('/api/v1/vouches', 'Vouches', {
      body: JSON.stringify(body),
      method: 'POST',
    });
    return response.data;
  }

  async getXpBySeason(userkey: string, seasonId: number): Promise<number> {
    return this.request<number>(
      `/api/v2/xp/user/${encodeURIComponent(userkey)}/season/${seasonId}`,
      'XP for Season'
    );
  }

  async getXpTotal(userkey: string): Promise<number> {
    return this.request<number>(`/api/v2/xp/user/${encodeURIComponent(userkey)}`, 'XP Balance');
  }

  async resolveUser(identifier: string): Promise<EthosUser> {
    const parsed = parseIdentifier(identifier);
    return this.resolveUserFromParsed(parsed);
  }

  async resolveUserFromParsed(parsed: ParsedIdentifier): Promise<EthosUser> {
    switch (parsed.type) {
      case 'address': {
        return this.getUserByAddress(parsed.value);
      }
      
      case 'ens': {
        return this.resolveEnsUser(parsed.value);
      }
      
      case 'profileId': {
        return this.getUserByProfileId(parsed.value);
      }
      
      default: {
        // Handles 'twitter' and any other cases
        return this.getUserByTwitter(parsed.value);
      }
    }
  }

  async searchUsers(query: string, limit = 10): Promise<SearchResult> {
    const params = new URLSearchParams({ limit: String(limit), query });
    return this.request<SearchResult>(`/api/v2/users/search?${params}`, 'Users');
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.error(`[DEBUG] ${message}`, data || '');
    }
  }

  private async request<T>(path: string, resourceType?: string, options?: Parameters<typeof fetch>[1]): Promise<T> {
     const url = `${this.baseUrl}${path}`;
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 10_000);

     this.log(`Fetching ${url}`);

      try {
        const response = await fetch(url, {
          headers: { 
            'Accept': 'application/json',
            'X-Ethos-Client': 'ethos-cli',
            ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
          },
          signal: controller.signal,
          ...options,
        });

       this.log(`Response status: ${response.status}`);

        if (!response.ok) {
          if (response.status === 404) {
            const identifier = path.split('/').pop() || 'unknown';
            throw new NotFoundError(resourceType || 'Resource', decodeURIComponent(identifier));
          }

          let errorMessage = `API request failed with status ${response.status}`;
          let errorBody;

          const responseText = await response.text();
          try {
            errorBody = JSON.parse(responseText);
            errorMessage = errorBody.message || errorBody.error || errorMessage;
          } catch {
            if (responseText) errorMessage = responseText;
          }

          this.log('API Error', { body: errorBody, status: response.status });
          throw new APIError(errorMessage, response.status, errorBody);
        }

       const data = await response.json() as T;
       this.log('Response data', data);
       return data;
     } catch (error) {
       if (error instanceof NotFoundError || error instanceof APIError) {
         throw error;
       }

       if (error instanceof Error) {
         this.log('Network error', error.message);

         if (error.name === 'AbortError') {
           throw new NetworkError('Request timed out after 10 seconds', url);
         }

         if (error.message.includes('fetch failed') ||
             error.message.includes('ECONNREFUSED') ||
             error.message.includes('ENOTFOUND')) {
           throw new NetworkError(`Cannot connect to API at ${this.baseUrl}`, url);
         }

         throw new NetworkError(error.message, url);
       }

       throw error;
     } finally {
       clearTimeout(timeoutId);
     }
   }

  private async resolveEnsUser(ensName: string): Promise<EthosUser> {
    const searchResult = await this.searchUsers(ensName, 5);
    
    const exactMatch = searchResult.values.find(u => 
      u.displayName?.toLowerCase() === ensName.toLowerCase() ||
      u.username?.toLowerCase() === ensName.toLowerCase()
    );
    
    if (exactMatch) return exactMatch;
    
    const addressMatch = searchResult.values.find(u =>
      u.userkeys?.some(uk => uk.startsWith('address:'))
    );
    
    if (addressMatch) return addressMatch;
    
    if (searchResult.values.length > 0) {
      return searchResult.values[0];
    }
    
    throw new NotFoundError('User', ensName);
  }
}
