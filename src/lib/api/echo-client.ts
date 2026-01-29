import { APIError, NetworkError, NotFoundError } from '../errors/cli-error.js';
import { parseIdentifier, type ParsedIdentifier } from '../validation/userkey.js';
import { loadConfig } from '../config/index.js';

export interface EthosUser {
  id: number;
  profileId: number | null;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  description: string | null;
  score: number;
  status: string;
  userkeys: string[];
  xpTotal: number;
  xpStreakDays: number;
  influenceFactor: number;
  influenceFactorPercentile: number;
  links?: {
    profile: string;
    scoreBreakdown: string;
  };
  stats?: {
    review: {
      received: { negative: number; neutral: number; positive: number };
    };
    vouch: {
      given: { amountWeiTotal: string; count: number };
      received: { amountWeiTotal: string; count: number };
    };
  };
}

export interface SearchResult {
  values: EthosUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate?: string;
  week?: number;
}

export interface SeasonsResponse {
  seasons: Season[];
  currentSeason: Season;
}

export interface ActivityAuthor {
  userkey: string;
  profileId: number | null;
  name: string;
  username: string | null;
  avatar: string | null;
  score: number;
}

export interface Activity {
  type: 'review' | 'vouch' | 'unvouch';
  timestamp: number;
  data: {
    id: number;
    comment?: string;
    score?: 'positive' | 'neutral' | 'negative';
    metadata?: string;
  };
  author: ActivityAuthor;
  subject: ActivityAuthor;
  link: string;
}

export type ActivityType = 'review' | 'vouch';

export interface Slash {
  id: number;
  authorProfileId: number;
  subject: null | number;
  createdAt: number;
  duration: number;
  closedAt: number;
  cancelledAt: number;
  amount: number;
  slashType: string;
  comment: string;
  metadata?: string;
  attestationDetails?: {
    service: string;
    account: string;
  };
}

export interface SlashesResponse {
  ok: boolean;
  data: {
    values: Slash[];
    total: number;
    limit: number;
    offset: number;
  };
}

export type BrokerPostType = 'SELL' | 'BUY' | 'HIRE' | 'FOR_HIRE' | 'BOUNTY';
export type BrokerPostLevel = 'BASIC' | 'PREMIUM';
export type BrokerPostStatus = 'OPEN' | 'COMPLETED' | 'CLOSED' | 'EXPIRED';
export type BrokerSortBy = 'newest' | 'score' | 'top' | 'expiresAt' | 'hot';

export interface BrokerPostAuthor {
  profileId: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  score: number;
}

export interface BrokerPost {
  id: number;
  type: BrokerPostType;
  level: BrokerPostLevel;
  status: BrokerPostStatus;
  title: string;
  description: string;
  tags: string[];
  expiresAt: string | null;
  createdAt: string;
  author: BrokerPostAuthor;
  votes: { upvotes: number; downvotes: number };
  replyCount: number;
}

export interface BrokerListParams {
  type?: BrokerPostType;
  search?: string;
  sortBy?: BrokerSortBy;
  minScore?: number;
  limit?: number;
  offset?: number;
}

export interface BrokerListResponse {
  values: BrokerPost[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectChain {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface ProjectVotes {
  bullish: { total: number; percentage: number };
  bearish: { total: number; percentage: number };
  all: { totalVoters: number; totalVotes: number };
}

export interface Project {
  id: number;
  userkey: string;
  status: 'ACTIVE' | 'PENDING' | 'ARCHIVED';
  description: string;
  bannerImageUrl?: string;
  isPromoted?: boolean;
  createdAt: string;
  updatedAt: string;
  user: EthosUser;
  categories?: string[];
  chains?: ProjectChain[];
  votes?: ProjectVotes;
}

export interface ProjectVoter {
  user: EthosUser;
  bullishCount: number;
  bearishCount: number;
  totalVotes: number;
  firstVoteAt: string;
  lastVoteAt: string;
  bullishReasons: string[];
  bearishReasons: string[];
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}

export interface ProjectVotersTotals {
  totalVoters: number;
  totalBullishVoters: number;
  totalBearishVoters: number;
  totalBullishVotes: number;
  totalBearishVotes: number;
}

export interface ProjectVotersResponse {
  values: ProjectVoter[];
  total: number;
  limit: number;
  offset: number;
  totals: ProjectVotersTotals;
}

export interface MarketUser {
  profileId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
}

export interface MarketStats {
  marketCapWei: string;
  marketCapChange24hWei?: string;
  marketCapChange24hPercent?: number;
  volumeTotalWei: string;
  volume24hWei?: string;
  priceChange24hPercent?: number;
}

export interface Market {
  id: number;
  creatorAddress: string;
  positivePrice: string;
  negativePrice: string;
  trustVotes: number;
  distrustVotes: number;
  createdAt: string;
  updatedAt: string;
  basePrice: string;
  user: MarketUser;
  stats: MarketStats;
}

export interface MarketHolder {
  actorAddress: string;
  marketId: number;
  voteType: 'trust' | 'distrust';
  total: string;
  user: MarketUser;
}

export type MarketOrderBy = 'marketCapWei' | 'volumeTotalWei' | 'volume24hWei' | 'trustRatio' | 'distrustRatio' | 'score' | 'createdAt' | 'priceChange24hPercent' | 'marketCapChange24hPercent' | 'scoreDifferential';

export interface MarketListParams {
  limit?: number;
  offset?: number;
  orderBy?: MarketOrderBy;
  orderDirection?: 'asc' | 'desc';
  filterQuery?: string;
}

export interface MarketListResponse {
  values: Market[];
  total: number;
  limit: number;
  offset: number;
}

export interface FeaturedMarket {
  type: 'top-volume' | 'undervalued' | 'rugging' | string;
  market: Market;
}

export type FeaturedMarketsResponse = FeaturedMarket[];

export interface MarketHoldersResponse {
  values: MarketHolder[];
  total: number;
}

export interface MarketUserByTwitter {
  profileId: number;
  twitterUsername: string;
  twitterName: string;
  twitterUserId: string;
  walletAddress: string;
  avatarUrl: string;
}

export interface NFT {
  tokenId: string;
  name: string | null;
  description?: string;
  imageUrl: string | null;
  contractAddress: string;
  contractName?: string;
}

export interface NftsResponse {
  values: NFT[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface ValidatorListing {
  orderHash: string;
  tokenId: string;
  name: string | null;
  imageUrl: string | null;
  priceWei: string;
  priceEth: string;
  currency: string;
  seller: string;
  openseaUrl: string;
}

export interface ValidatorListingsResponse {
  values: ValidatorListing[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface AuctionBuyer {
  displayName?: string;
  username?: string | null;
}

export interface Auction {
  id: number;
  nftTokenId: number;
  nftContract: string;
  creatorAddress: string;
  startPrice: string;  // wei
  reservePrice: string;  // wei
  duration: number;
  startTime: string;
  status: 'PENDING' | 'ENABLED' | 'ENDED' | 'SOLD';
  buyerAddress: string | null;
  pricePaid: string | null;  // wei
  soldTime: string | null;
  createdAt: string;
  buyerUser?: AuctionBuyer | null;
}

export interface AuctionsResponse {
  values: Auction[];
  total: number;
}

export interface Validator {
  tokenId: string;
  name: string;
  imageUrl: string;
  ownerAddress: string;
  ownerProfileId: number;
  ownerDisplayName: string;
  ownerUsername: string | null;
  ownerAvatarUrl: string | null;
  currentXp: number;
  remainingCapacity: number;
  xpCap: number;
  isFull: boolean;
}

export type ScoreLevel = 'untrusted' | 'questionable' | 'neutral' | 'reputable' | 'exemplary';

export interface ScoreResponse {
  score: number;
  level: ScoreLevel;
}

export interface ScoreBreakdownElement {
  element: {
    name: string;
    type: string;
    range?: { min: number; max: number };
  };
  raw: number;
  weighted: number;
  error: boolean;
}

export interface ScoreBreakdownResponse {
  ok: boolean;
  data: {
    score: number;
    elements: Record<string, ScoreBreakdownElement>;
    metadata: Record<string, unknown>;
    errors: string[];
  };
}

export interface ScoreStatus {
  status: 'idle' | 'queued' | 'calculating';
  isQueued: boolean;
  isCalculating: boolean;
  isPending: boolean;
}

// Vouch types
export interface VouchUser {
  id?: number;
  profileId?: number | null;
  displayName?: string;
  username?: string | null;
  avatarUrl?: string | null;
  score?: number;
  userkeys?: string[];
}

export interface Vouch {
  id: number;
  authorProfileId: number;
  subjectProfileId: number;
  subjectAddress: string | null;
  balance: string;  // bigint as string
  comment: string;
  metadata: string;
  archived: boolean;
  mutualId: number | null;
  deposited: string;
  staked: string;
  withdrawn: string;
  unhealthy: boolean;
  authorAddress: string;
  activityCheckpoints: {
    vouchedAt: number;
    unvouchedAt: number;
    unhealthyAt: number;
  };
  attestationDetails?: {
    service: string;
    account: string;
  } | null;
  authorUser?: VouchUser | null;
  subjectUser?: VouchUser | null;
}

export interface VouchesResponse {
  values: Vouch[];
  total: number;
  limit: number;
  offset: number;
}

export interface VouchQueryParams {
  ids?: number[];
  subjectUserkeys?: string[];
  authorProfileIds?: number[];
  subjectProfileIds?: number[];
  archived?: boolean;
  limit?: number;
  offset?: number;
}

// Vote types
export type VoteType = 'review' | 'vouch' | 'slash';

export interface VoteUser {
  id: number;
  profileId: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  score: number;
}

export interface Vote {
  isUpvote: boolean;
  isArchived: boolean;
  voter: number;
  targetContract: string;
  targetId: string;
  createdAt: number;
  weight: number;
  user: VoteUser;
}

export interface VotesResponse {
  values: Vote[];
  total: number;
  limit: number;
  offset: number;
}

export interface VoteStats {
  userVote: { isUpvote: boolean } | null;
  counts: {
    upvotes: number;
    downvotes: number;
  };
  weights: {
    weightedUpvotes: number;
    weightedDownvotes: number;
    upvotePercentage: number;
    downvotePercentage: number;
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

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.error(`[DEBUG] ${message}`, data || '');
    }
  }

   private async request<T>(path: string, resourceType?: string, options?: RequestInit): Promise<T> {
     const url = `${this.baseUrl}${path}`;
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 10000);

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

          this.log('API Error', { status: response.status, body: errorBody });
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

  async getUserByTwitter(username: string): Promise<EthosUser> {
    return this.request<EthosUser>(`/api/v2/user/by/x/${encodeURIComponent(username)}`, 'User');
  }

  async getUserByAddress(address: string): Promise<EthosUser> {
    return this.request<EthosUser>(`/api/v2/user/by/address/${encodeURIComponent(address)}`, 'User');
  }

  async getUserByProfileId(profileId: string): Promise<EthosUser> {
    return this.request<EthosUser>(`/api/v2/user/by/profile-id/${encodeURIComponent(profileId)}`, 'User');
  }

  async searchUsers(query: string, limit = 10): Promise<SearchResult> {
    const params = new URLSearchParams({ query, limit: String(limit) });
    return this.request<SearchResult>(`/api/v2/users/search?${params}`, 'Users');
  }

  async resolveUser(identifier: string): Promise<EthosUser> {
    const parsed = parseIdentifier(identifier);
    return this.resolveUserFromParsed(parsed);
  }

  async resolveUserFromParsed(parsed: ParsedIdentifier): Promise<EthosUser> {
    switch (parsed.type) {
      case 'address':
        return this.getUserByAddress(parsed.value);
      
      case 'ens':
        return this.resolveEnsUser(parsed.value);
      
      case 'profileId':
        return this.getUserByProfileId(parsed.value);
      
      case 'twitter':
      default:
        return this.getUserByTwitter(parsed.value);
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

  async getXpTotal(userkey: string): Promise<number> {
    return this.request<number>(`/api/v2/xp/user/${encodeURIComponent(userkey)}`, 'XP Balance');
  }

  async getSeasons(): Promise<SeasonsResponse> {
    return this.request<SeasonsResponse>('/api/v2/xp/seasons', 'XP Seasons');
  }

  async getLeaderboardRank(userkey: string): Promise<number> {
    return this.request<number>(`/api/v2/xp/user/${encodeURIComponent(userkey)}/leaderboard-rank`, 'Leaderboard Rank');
  }

  async getXpBySeason(userkey: string, seasonId: number): Promise<number> {
    return this.request<number>(
      `/api/v2/xp/user/${encodeURIComponent(userkey)}/season/${seasonId}`,
      'XP for Season'
    );
  }

  async getActivities(userkey: string, types: ActivityType[] = ['review', 'vouch'], limit = 10): Promise<Activity[]> {
    const params = new URLSearchParams({ userkey, limit: String(limit) });
    for (const type of types) {
      params.append('activityType', type);
    }
    return this.request<Activity[]>(`/api/v2/activities/userkey?${params}`, 'Activities');
  }

  getPrimaryUserkey(user: EthosUser): string | null {
    if (user.profileId) {
      return `profileId:${user.profileId}`;
    }
    
    const addressKey = user.userkeys?.find(uk => uk.startsWith('address:'));
    if (addressKey) return addressKey;
    
    return user.userkeys?.[0] || null;
  }

  /** @deprecated Use resolveUser instead */
  async getUserByUsername(username: string): Promise<EthosUser> {
    return this.getUserByTwitter(username);
  }

   /** @deprecated Use getXpTotal instead */
   async getTotalXp(userkey: string): Promise<number> {
     return this.getXpTotal(userkey);
   }

   async getSlashes(params: { author?: string; subject?: string; status?: 'open' | 'closed'; limit?: number; offset?: number } = {}): Promise<SlashesResponse> {
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
     profileIds.forEach(id => query.append('profileId', String(id)));
     return this.request<Record<number, string>>(`/api/v1/slashes/${slashId}/roles?${query.toString()}`, 'Slash Roles');
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

  async getBrokerPost(id: number): Promise<BrokerPost> {
    return this.request<BrokerPost>(`/api/v2/broker/posts/${id}`, 'Broker Post');
  }

  async getBrokerPostsByAuthor(profileId: number, params: { type?: BrokerPostType; limit?: number } = {}): Promise<BrokerListResponse> {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.limit) query.set('limit', String(params.limit));
    const path = `/api/v2/broker/author/${profileId}/posts${query.toString() ? '?' + query.toString() : ''}`;
    return this.request<BrokerListResponse>(path, 'Author Posts');
  }

  async getProjects(params: { status?: string[]; limit?: number; offset?: number } = {}): Promise<ProjectListResponse> {
    const query = new URLSearchParams();
    if (params.status) params.status.forEach(s => query.append('status[]', s));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    return this.request<ProjectListResponse>(`/api/v2/projects${query.toString() ? '?' + query.toString() : ''}`, 'Projects');
  }

  async getProjectDetails(projectId: number): Promise<Project> {
    return this.request<Project>(`/api/v2/projects/${projectId}/details`, 'Project');
  }

  async getProjectByUsername(username: string): Promise<Project> {
    return this.request<Project>(`/api/v2/projects/username/${encodeURIComponent(username)}`, 'Project');
  }

  async getProjectVoters(projectId: number, params: { limit?: number; offset?: number; sentiment?: 'bullish' | 'bearish' } = {}): Promise<ProjectVotersResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));
    if (params.sentiment) query.set('sentiment', params.sentiment);
    return this.request<ProjectVotersResponse>(`/api/v2/projects/${projectId}/voters${query.toString() ? '?' + query.toString() : ''}`, 'Voters');
  }

   async getProjectTeam(projectId: number): Promise<EthosUser[]> {
     return this.request<EthosUser[]>(`/api/v2/projects/${projectId}/team`, 'Team');
   }

   async getNftsForUser(userkey: string, params: { limit?: number; offset?: number } = {}): Promise<NftsResponse> {
     const query = new URLSearchParams();
     if (params.limit) query.set('limit', String(params.limit));
     if (params.offset) query.set('offset', String(params.offset));
     const path = `/api/v2/nfts/user/${encodeURIComponent(userkey)}${query.toString() ? '?' + query.toString() : ''}`;
     return this.request<NftsResponse>(path, 'User NFTs');
   }

   async checkValidatorOwnership(userkey: string): Promise<NFT[]> {
     return this.request<NFT[]>(`/api/v2/nfts/user/${encodeURIComponent(userkey)}/owns-validator`, 'Validator Check');
   }

    async getValidatorListings(params: { limit?: number; offset?: number } = {}): Promise<ValidatorListingsResponse> {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      const path = `/api/v2/nfts/validators/listings${query.toString() ? '?' + query.toString() : ''}`;
      return this.request<ValidatorListingsResponse>(path, 'Validator Listings');
    }

    async getAuctions(params: { limit?: number; offset?: number; status?: string } = {}): Promise<AuctionsResponse> {
      const query = new URLSearchParams();
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      if (params.status) query.set('status', params.status);
      const path = `/api/v2/auctions${query.toString() ? '?' + query.toString() : ''}`;
      return this.request<AuctionsResponse>(path, 'Auctions');
    }

    async getActiveAuction(): Promise<Auction | null> {
      return this.request<Auction | null>('/api/v2/auctions/active', 'Active Auction');
    }

    async getAuction(auctionId: number): Promise<Auction> {
      return this.request<Auction>(`/api/v2/auctions/${auctionId}`, 'Auction');
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

  async getFeaturedMarkets(): Promise<FeaturedMarketsResponse> {
    return this.request<FeaturedMarketsResponse>('/api/v2/markets/featured', 'Featured Markets');
  }

  async getMarketInfo(profileId: number): Promise<Market> {
    return this.request<Market>(`/api/v2/markets/${profileId}/info`, 'Market Info', {
      method: 'POST',
      body: JSON.stringify({ profileId, includeTopHolders: true, includeMarketChange: true }),
    });
  }

  async getMarketHolders(profileId: number, params: { limit?: number } = {}): Promise<MarketHoldersResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<MarketHoldersResponse>(`/api/v2/markets/${profileId}/holders${query.toString() ? '?' + query.toString() : ''}`, 'Market Holders');
  }

  async getMarketByTwitter(username: string): Promise<MarketUserByTwitter> {
    return this.request<MarketUserByTwitter>(`/api/v2/markets/users/by/x/${encodeURIComponent(username)}`, 'Market User');
  }

  async getScoreBreakdownByUserkey(userkey: string): Promise<ScoreBreakdownResponse> {
    const params = new URLSearchParams({ userkey });
    return this.request<ScoreBreakdownResponse>(`/api/v1/score/userkey?${params}`, 'Score');
  }

  async getScoreBreakdownByAddress(address: string): Promise<ScoreBreakdownResponse> {
    const params = new URLSearchParams({ address });
    return this.request<ScoreBreakdownResponse>(`/api/v1/score/address?${params}`, 'Score');
  }

  convertScoreToLevel(score: number): ScoreLevel {
    if (score < 800) return 'untrusted';
    if (score < 1200) return 'questionable';
    if (score < 1600) return 'neutral';
    if (score < 2000) return 'reputable';
    return 'exemplary';
  }

  async getScoreStatus(userkey: string): Promise<ScoreStatus> {
    const params = new URLSearchParams({ userkey });
    return this.request<ScoreStatus>(`/api/v2/score/status?${params}`, 'Score Status');
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

    const response = await this.request<{ ok: boolean; data: VouchesResponse }>('/api/v1/vouches', 'Vouches', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data;
  }

  async getMutualVouchers(viewerProfileId: number, targetProfileId: number, params: { limit?: number } = {}): Promise<{ values: VouchUser[]; total: number }> {
    const query = new URLSearchParams();
    query.set('viewerProfileId', String(viewerProfileId));
    query.set('targetProfileId', String(targetProfileId));
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ values: VouchUser[]; total: number }>(`/api/v2/vouches/mutual-vouchers?${query}`, 'Mutual Vouchers');
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

  async getValidators(): Promise<Validator[]> {
    return this.request<Validator[]>('/api/v2/xp/validators', 'Validators');
  }

  async getValidatorByTokenId(tokenId: string): Promise<Validator | null> {
    const validators = await this.getValidators();
    return validators.find(v => v.tokenId === tokenId) || null;
  }
}
