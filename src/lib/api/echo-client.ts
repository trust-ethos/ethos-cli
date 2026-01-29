import { APIError, NetworkError, NotFoundError } from '../errors/cli-error.js';
import { parseIdentifier, type ParsedIdentifier } from '../validation/userkey.js';
import { loadConfig } from '../config/index.js';

const API_URLS = {
  dev: 'https://api.dev.ethos.network',
  staging: 'https://api.dev.ethos.network',
  prod: 'https://api.ethos.network',
} as const;

type Environment = keyof typeof API_URLS;

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

export class EchoClient {
  private baseUrl: string;
  private debug: boolean;

  constructor(env?: Environment) {
    const config = loadConfig();
    const environment = env || 
      (process.env.ETHOS_ENV as Environment) || 
      config.environment || 
      'prod';
    this.baseUrl = process.env.ETHOS_API_URL || config.apiUrl || API_URLS[environment];
    this.debug = process.env.ETHOS_DEBUG === 'true' || process.env.DEBUG === 'ethos:*';
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.error(`[DEBUG] ${message}`, data || '');
    }
  }

   private async request<T>(path: string, resourceType?: string): Promise<T> {
     const url = `${this.baseUrl}${path}`;
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 10000);

     this.log(`Fetching ${url}`);

     try {
       const response = await fetch(url, {
         headers: { 'Accept': 'application/json' },
         signal: controller.signal,
       });

       this.log(`Response status: ${response.status}`);

       if (!response.ok) {
         if (response.status === 404) {
           const identifier = path.split('/').pop() || 'unknown';
           throw new NotFoundError(resourceType || 'Resource', decodeURIComponent(identifier));
         }

         let errorMessage = `API request failed with status ${response.status}`;
         let errorBody;

         try {
           errorBody = await response.json();
           errorMessage = errorBody.message || errorBody.error || errorMessage;
         } catch {
           const errorText = await response.text();
           if (errorText) errorMessage = errorText;
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

   async getSlashes(params: { author?: string; subject?: string; status?: 'open' | 'closed'; limit?: number } = {}): Promise<SlashesResponse> {
     const query = new URLSearchParams();
     if (params.author) query.set('author', params.author);
     if (params.subject) query.set('subject', params.subject);
     if (params.status) query.set('status', params.status);
     if (params.limit) query.set('limit', String(params.limit));
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

  async getProjectVoters(projectId: number, params: { limit?: number; sentiment?: 'bullish' | 'bearish' } = {}): Promise<ProjectVotersResponse> {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sentiment) query.set('sentiment', params.sentiment);
    return this.request<ProjectVotersResponse>(`/api/v2/projects/${projectId}/voters${query.toString() ? '?' + query.toString() : ''}`, 'Voters');
  }

  async getProjectTeam(projectId: number): Promise<EthosUser[]> {
    return this.request<EthosUser[]>(`/api/v2/projects/${projectId}/team`, 'Team');
  }
}
