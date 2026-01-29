import pc from 'picocolors';
import type { Activity, Auction, BrokerPost, EthosUser, FeaturedMarketsResponse, InvitationWithUser, Market, MarketHolder, Project, ProjectVoter, ProjectVotersTotals, Review, ScoreLevel, ScoreResponse, ScoreStatus, Season, Slash, Validator, Vote, VoteStats, Vouch, VouchUser } from '../api/echo-client.js';

export function output<T>(data: T): string {
  return JSON.stringify(data, null, 2);
}

function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

function getScoreLevel(score: number): ScoreLevel {
  if (score < 800) return 'untrusted';
  if (score < 1200) return 'questionable';
  if (score < 1600) return 'neutral';
  if (score < 2000) return 'reputable';
  return 'exemplary';
}

export function formatUser(user: EthosUser): string {
  const displayName = user.displayName || user.username || 'Unknown';
  const lines = [
    pc.bold(pc.cyan(`User Profile: ${displayName}`)),
    '',
  ];

  if (user.username) {
    lines.push(`${pc.dim('Username:')} @${user.username}`);
  }

  if (user.profileId) {
    lines.push(`${pc.dim('Profile ID:')} ${user.profileId}`);
  }

  const level = getScoreLevel(user.score);
  const levelColor = LEVEL_COLORS[level] || pc.white;
  lines.push(`${pc.dim('Score:')} ${pc.green(String(user.score))} ${levelColor(`(${level.toUpperCase()})`)}`);
  lines.push(`${pc.dim('Status:')} ${user.status}`);
  lines.push(`${pc.dim('XP:')} ${pc.green(user.xpTotal.toLocaleString())}`);
  
  if (user.xpStreakDays > 0) {
    const dayWord = pluralize(user.xpStreakDays, 'day');
    lines.push(`${pc.dim('Streak:')} ${user.xpStreakDays} ${dayWord}`);
  }

  if (user.stats) {
    lines.push('');
    lines.push(pc.bold('Stats'));
    
    const reviews = user.stats.review.received;
    const reviewTotal = reviews.positive + reviews.neutral + reviews.negative;
    if (reviewTotal > 0) {
      lines.push(`${pc.dim('Reviews Received:')} ${pc.green(`${reviews.positive} positive`)}, ${reviews.neutral} neutral, ${pc.red(`${reviews.negative} negative`)}`);
    }

    const vouches = user.stats.vouch;
    if (vouches.received.count > 0 || vouches.given.count > 0) {
      lines.push(`${pc.dim('Vouches:')} ${vouches.received.count} received, ${vouches.given.count} given`);
    }
  }

  if (user.links?.profile) {
    lines.push('');
    lines.push(`${pc.dim('Profile:')} ${user.links.profile}`);
  }

  return lines.join('\n');
}

export function formatInvitations(invitations: InvitationWithUser[], total: number): string {
  if (!invitations.length) {
    return pc.yellow('No invitations found.');
  }

  const lines = [pc.bold(`Invitations (${total} total)`), ''];

  for (const inv of invitations) {
    const i = inv.invitation;
    const user = inv.invitedUser;
    const statusIcon = i.status === 'ACCEPTED' ? pc.green('✓') : pc.yellow('○');
    const userName = user?.username ? `@${user.username}` : user?.displayName || i.recipientAddress.slice(0, 10) + '...';
    const date = new Date(i.dateInvited).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    lines.push(`${statusIcon} ${pc.bold(userName)} ${pc.dim(`(${i.status})`)}`);
    lines.push(`   ${pc.dim('Invited:')} ${date}`);
    
    if (i.dateAccepted) {
      const acceptedDate = new Date(i.dateAccepted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      lines.push(`   ${pc.dim('Accepted:')} ${acceptedDate}`);
    }

    if (user?.score) {
      lines.push(`   ${pc.dim('Score:')} ${user.score}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

export function formatSeasons(seasons: Season[], currentSeason?: Season): string {
  if (!seasons || seasons.length === 0) {
    return pc.yellow('No seasons found');
  }

  const lines = [pc.bold(pc.cyan('XP Seasons')), ''];

  if (currentSeason) {
    lines.push(`${pc.dim('Current:')} Season ${currentSeason.id} (Week ${currentSeason.week || 1})`);
    lines.push('');
  }

  for (const season of seasons) {
    const isCurrent = currentSeason && season.id === currentSeason.id;
    const prefix = isCurrent ? pc.green('*') : ' ';
    lines.push(`${prefix} ${pc.bold(`Season ${season.id}`)}`);
    lines.push(`    ${pc.dim('Start:')} ${new Date(season.startDate).toLocaleDateString()}`);
    if (season.endDate) {
      lines.push(`    ${pc.dim('End:')} ${new Date(season.endDate).toLocaleDateString()}`);
    }
  }

  return lines.join('\n');
}

export function formatRank(data: { rank: number; totalXp?: number; userkey?: string; username?: string; seasonXp?: number; season?: number }): string {
  const lines = [
    pc.bold(pc.cyan('Leaderboard Rank')),
    '',
    `${pc.dim('Rank:')} ${pc.green(`#${data.rank.toLocaleString()}`)}`,
  ];

  if (data.totalXp !== undefined) {
    lines.push(`${pc.dim('Total XP:')} ${pc.green(data.totalXp.toLocaleString())}`);
  }

  if (data.seasonXp !== undefined && data.season !== undefined) {
    lines.push(`${pc.dim(`Season ${data.season} XP:`)} ${pc.green(data.seasonXp.toLocaleString())}`);
  }

  if (data.username) {
    lines.push(`${pc.dim('User:')} ${data.username}`);
  } else if (data.userkey) {
    lines.push(`${pc.dim('Userkey:')} ${data.userkey}`);
  }

  return lines.join('\n');
}

export function formatSearchResults(results: EthosUser[]): string {
  if (!results || results.length === 0) {
    return pc.yellow('No users found');
  }

  const lines = [
    pc.bold(pc.cyan(`Search Results (${results.length} found)`)),
    '',
  ];

  for (const user of results) {
    const displayName = user.displayName || user.username || 'Unknown';
    lines.push(pc.bold(displayName));
    if (user.username) {
      lines.push(`  ${pc.dim('Username:')} @${user.username}`);
    }
    lines.push(`  ${pc.dim('Score:')} ${pc.green(String(user.score))}`);
    lines.push(`  ${pc.dim('XP:')} ${user.xpTotal.toLocaleString()}`);
    lines.push('');
  }

  return lines.join('\n');
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseMetadata(metadata?: string): { description?: string } {
  if (!metadata) return {};
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
}

export function formatActivities(activities: Activity[], username?: string): string {
  if (!activities || activities.length === 0) {
    return pc.yellow('No activities found');
  }

  const lines = [
    pc.bold(pc.cyan(`Recent Activity${username ? ` for ${username}` : ''}`)),
    '',
  ];

  for (const activity of activities) {
    const typeIcon = activity.type === 'vouch' ? '🤝' : activity.type === 'review' ? '📝' : '❌';
    const typeLabel = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
    const date = formatTimestamp(activity.timestamp);
    
    lines.push(`${typeIcon} ${pc.bold(typeLabel)} ${pc.dim(`• ${date}`)}`);
    
    const authorName = activity.author.username ? `@${activity.author.username}` : activity.author.name;
    const subjectName = activity.subject.username ? `@${activity.subject.username}` : activity.subject.name;
    lines.push(`   ${pc.dim('From:')} ${authorName} ${pc.dim('→')} ${subjectName}`);
    
    if (activity.data.comment) {
      const comment = activity.data.comment.length > 60 
        ? activity.data.comment.substring(0, 57) + '...'
        : activity.data.comment;
      lines.push(`   ${pc.dim('Title:')} ${comment}`);
    }
    
    if (activity.data.score) {
      const scoreColor = activity.data.score === 'positive' ? pc.green : 
                         activity.data.score === 'negative' ? pc.red : pc.dim;
      lines.push(`   ${pc.dim('Score:')} ${scoreColor(activity.data.score)}`);
    }
    
    const meta = parseMetadata(activity.data.metadata);
    if (meta.description) {
      const desc = meta.description.length > 80 
        ? meta.description.substring(0, 77) + '...'
        : meta.description;
      lines.push(`   ${pc.dim(desc)}`);
    }
    
    lines.push('');
  }

  return lines.join('\n');
}

export function formatSlash(slash: Slash): string {
  const isOpen = !slash.closedAt && !slash.cancelledAt;
  const statusIcon = isOpen ? pc.red('⚔️ OPEN') : pc.gray('✓ CLOSED');
  
  const lines = [
    pc.bold(`Slash #${slash.id}`),
    statusIcon,
    '',
    `${pc.dim('Author Profile:')} ${slash.authorProfileId}`,
    `${pc.dim('Subject:')} ${slash.subject || 'Unknown'}`,
    `${pc.dim('Amount:')} ${slash.amount}`,
    `${pc.dim('Type:')} ${slash.slashType}`,
    '',
    pc.dim('Reason:'),
    slash.comment || 'No reason provided',
  ];

  lines.push('', `${pc.dim('Created:')} ${new Date(slash.createdAt * 1000).toLocaleString()}`);

  return lines.join('\n');
}

export function formatSlashes(slashes: Slash[], total: number): string {
  if (!slashes.length) {
    return pc.yellow('No slashes found.');
  }

  const lines = [pc.bold(`Slashes (${total} total)`), ''];

  for (const s of slashes) {
    const isOpen = !s.closedAt && !s.cancelledAt;
    const statusIcon = isOpen ? pc.red('⚔️') : pc.gray('✓');
    
    lines.push(`${statusIcon} ${pc.bold('#' + s.id)} Author: ${s.authorProfileId} → Subject: ${s.subject || 'Unknown'}`);
    const commentPreview = s.comment ? (s.comment.slice(0, 40) + (s.comment.length > 40 ? '...' : '')) : 'No reason';
    lines.push(`   ${pc.dim('Amount:')} ${s.amount} ${pc.dim('|')} ${commentPreview}`);
    lines.push('');
  }

  return lines.join('\n');
}

const REVIEW_SCORE_COLORS: Record<string, (s: string) => string> = {
  positive: pc.green,
  neutral: pc.yellow,
  negative: pc.red,
};

const REVIEW_SCORE_ICONS: Record<string, string> = {
  positive: '👍',
  neutral: '😐',
  negative: '👎',
};

export function formatReview(review: Review): string {
  const score = review.data.score;
  const scoreColor = REVIEW_SCORE_COLORS[score] || pc.white;
  const scoreIcon = REVIEW_SCORE_ICONS[score] || '📝';
  
  const authorName = review.author?.username ? `@${review.author.username}` : review.author?.name || `Profile #${review.data.authorProfileId}`;
  const subjectName = review.subject?.username ? `@${review.subject.username}` : review.subject?.name || review.data.subject;
  
  const lines = [
    pc.bold(`${scoreIcon} Review #${review.data.id}`),
    scoreColor(score.toUpperCase()),
    '',
    `${pc.dim('From:')} ${authorName}`,
    `${pc.dim('To:')} ${subjectName}`,
    `${pc.dim('Score:')} ${scoreColor(score)}`,
  ];

  if (review.data.comment) {
    lines.push('', pc.dim('Comment:'), review.data.comment);
  }

  lines.push('');
  lines.push(`${pc.dim('Votes:')} 👍 ${review.votes?.upvotes || 0}  👎 ${review.votes?.downvotes || 0}`);
  
  if (review.replySummary?.count > 0) {
    lines.push(`${pc.dim('Replies:')} ${review.replySummary.count}`);
  }

  lines.push(`${pc.dim('Created:')} ${new Date(review.data.createdAt * 1000).toLocaleString()}`);

  if (review.link) {
    lines.push('', `${pc.dim('Link:')} ${review.link}`);
  }

  return lines.join('\n');
}

export function formatReviews(activities: Activity[], total?: number): string {
  const reviews = activities.filter(a => a.type === 'review');
  
  if (!reviews.length) {
    return pc.yellow('No reviews found.');
  }

  const lines = [pc.bold(`Reviews${total !== undefined ? ` (${total} total)` : ''}`), ''];

  for (const r of reviews) {
    const score = r.data.score || 'neutral';
    const scoreColor = REVIEW_SCORE_COLORS[score] || pc.white;
    const scoreIcon = REVIEW_SCORE_ICONS[score] || '📝';
    
    const authorName = r.author?.username ? `@${r.author.username}` : r.author?.name || 'Unknown';
    const subjectName = r.subject?.username ? `@${r.subject.username}` : r.subject?.name || 'Unknown';
    const date = new Date(r.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    lines.push(`${scoreIcon} ${pc.bold('#' + r.data.id)} ${authorName} → ${subjectName} ${scoreColor(`[${score.toUpperCase()}]`)}`);
    
    if (r.data.comment) {
      const preview = r.data.comment.slice(0, 60) + (r.data.comment.length > 60 ? '...' : '');
      lines.push(`   ${pc.dim(preview)}`);
    }
    
    lines.push(`   ${pc.dim(date)}`);
    lines.push('');
  }

  return lines.join('\n');
}

const BROKER_TYPE_EMOJI: Record<string, string> = {
  'SELL': '🏷️',
  'BUY': '🛒',
  'HIRE': '👔',
  'FOR_HIRE': '🧑‍💻',
  'BOUNTY': '🎯',
};

const BROKER_STATUS_COLOR: Record<string, (s: string) => string> = {
  'OPEN': pc.green,
  'COMPLETED': pc.blue,
  'CLOSED': pc.gray,
  'EXPIRED': pc.red,
};

export function formatBrokerPost(post: BrokerPost): string {
  const typeEmoji = BROKER_TYPE_EMOJI[post.type] || '📝';
  const statusColor = BROKER_STATUS_COLOR[post.status] || pc.white;

  const lines = [
    pc.bold(`${typeEmoji} ${post.title}`),
    '',
    `${pc.dim('Type:')} ${post.type} ${post.level === 'PREMIUM' ? pc.yellow('⭐ PREMIUM') : ''}`,
    `${pc.dim('Status:')} ${statusColor(post.status)}`,
    `${pc.dim('Author:')} ${post.author?.username ? '@' + post.author.username : post.author?.displayName || 'Unknown'} (Score: ${post.author?.score || 0})`,
    '',
    pc.dim('Description:'),
    post.description?.slice(0, 300) + (post.description?.length > 300 ? '...' : ''),
    '',
    `${pc.dim('Votes:')} 👍 ${post.votes?.upvotes || 0}  👎 ${post.votes?.downvotes || 0}  💬 ${post.replyCount || 0} replies`,
  ];

  if (post.tags?.length) {
    lines.push(`${pc.dim('Tags:')} ${post.tags.map((t: string) => pc.cyan('#' + t)).join(' ')}`);
  }

  if (post.expiresAt) {
    lines.push(`${pc.dim('Expires:')} ${new Date(post.expiresAt).toLocaleDateString()}`);
  }

  return lines.join('\n');
}

export function formatBrokerPosts(posts: BrokerPost[], total: number): string {
  if (!posts.length) {
    return pc.yellow('No broker posts found.');
  }

  const lines = [
    pc.bold(`Broker Posts (${total} total)`),
    '',
  ];

  for (const post of posts) {
    const typeEmoji = BROKER_TYPE_EMOJI[post.type] || '📝';
    const status = post.status === 'OPEN' ? pc.green('●') : pc.gray('○');
    lines.push(
      `${status} ${typeEmoji} ${pc.bold('#' + post.id)} ${post.title.slice(0, 50)}${post.title.length > 50 ? '...' : ''}`
    );
    lines.push(
      `   ${pc.dim('by')} ${post.author?.username ? '@' + post.author.username : 'Unknown'} ${pc.dim('|')} 👍 ${post.votes?.upvotes || 0} ${pc.dim('|')} 💬 ${post.replyCount || 0}`
    );
    lines.push('');
  }

  return lines.join('\n');
}

export function formatListing(project: Project): string {
  const name = project.user?.displayName || 'Unknown';
  const username = project.user?.username;
  
  const lines = [
    pc.bold(pc.cyan(name)),
    username ? pc.dim(`@${username}`) : '',
    '',
    `${pc.dim('Status:')} ${project.status === 'ACTIVE' ? pc.green('ACTIVE') : pc.yellow(project.status)}`,
    `${pc.dim('Score:')} ${pc.green(String(project.user?.score || 0))}`,
  ];

  if (project.description) {
    lines.push('', pc.dim('Description:'), project.description.slice(0, 300) + (project.description.length > 300 ? '...' : ''));
  }

  if (project.votes) {
    lines.push(
      '',
      pc.bold('Votes'),
      `  ${pc.green('Bullish:')} ${project.votes.bullish?.total || 0} (${project.votes.bullish?.percentage || 0}%)`,
      `  ${pc.red('Bearish:')} ${project.votes.bearish?.total || 0} (${project.votes.bearish?.percentage || 0}%)`,
      `  ${pc.dim('Total:')} ${project.votes.all?.totalVotes || 0} votes from ${project.votes.all?.totalVoters || 0} voters`
    );
  }

  if (project.categories?.length) {
    lines.push(`${pc.dim('Categories:')} ${project.categories.join(', ')}`);
  }

  if (project.chains?.length) {
    lines.push(`${pc.dim('Chains:')} ${project.chains.map((c) => c.name).join(', ')}`);
  }

  if (project.user?.links?.profile) {
    lines.push(`${pc.dim('Profile:')} ${project.user.links.profile}`);
  }

  return lines.filter(Boolean).join('\n');
}

export function formatListings(projects: Project[], total: number): string {
  if (!projects.length) {
    return pc.yellow('No listings found.');
  }

  const lines = [pc.bold(`Listings (${total} total)`), ''];

  for (const p of projects) {
    const name = p.user?.displayName || 'Unknown';
    const username = p.user?.username || 'unknown';
    const score = p.user?.score || 0;
    const bullish = p.votes?.bullish?.percentage || 0;
    const sentiment = bullish >= 60 ? pc.green('>>') : bullish <= 40 ? pc.red('<<') : pc.yellow('==');
    lines.push(`${sentiment} ${pc.bold(name)} ${pc.dim('@' + username)} (Score: ${score})`);
    if (p.votes) {
      lines.push(`   ${pc.green(bullish + '% bullish')} | ${p.votes.all?.totalVoters || 0} voters`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatListingVoters(voters: ProjectVoter[], totals: ProjectVotersTotals): string {
  if (!voters.length) {
    return pc.yellow('No voters found.');
  }

  const lines = [
    pc.bold(`Project Voters (${totals.totalVoters} total)`),
    `${pc.green('Bullish Voters:')} ${totals.totalBullishVoters} (${totals.totalBullishVotes} votes)`,
    `${pc.red('Bearish Voters:')} ${totals.totalBearishVoters} (${totals.totalBearishVotes} votes)`,
    '',
  ];

  for (const v of voters) {
    const name = v.user?.username ? `@${v.user.username}` : v.user?.displayName || 'Unknown';
    const sentiment = v.bullishCount > v.bearishCount ? pc.green('>>') : pc.red('<<');
    lines.push(`${sentiment} ${pc.bold(name)} (Score: ${v.user?.score || 0})`);
    lines.push(`   Bullish: ${v.bullishCount} | Bearish: ${v.bearishCount} | Total: ${v.totalVotes}`);
    const reasons = [...(v.bullishReasons || []), ...(v.bearishReasons || [])];
    if (reasons.length) {
      lines.push(`   ${pc.dim('Reasons:')} ${reasons.slice(0, 3).join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatNfts(nfts: any[], total: number): string {
  if (!nfts.length) {
    return pc.yellow('No NFTs found.');
  }

  const lines = [pc.bold(`NFTs (${total} total)`), ''];

  for (const nft of nfts) {
    lines.push(`🖼️  ${pc.bold(nft.name || `Token #${nft.tokenId}`)}`);
    if (nft.contractName) lines.push(`   ${pc.dim('Collection:')} ${nft.contractName}`);
    lines.push(`   ${pc.dim('Token ID:')} ${nft.tokenId}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatValidatorListings(listings: any[], total: number): string {
  if (!listings.length) {
    return pc.yellow('No validator NFTs listed for sale.');
  }

  const lines = [pc.bold(`🎫 Validator NFTs For Sale (${total} total)`), ''];

  for (const l of listings) {
    lines.push(`🎫 ${pc.bold(l.name || `Validator #${l.tokenId}`)}`);
    lines.push(`   ${pc.dim('Price:')} ${pc.green(l.priceEth + ' ETH')}`);
    lines.push(`   ${pc.dim('Seller:')} ${l.seller.slice(0, 10)}...`);
    lines.push(`   ${pc.dim('OpenSea:')} ${l.openseaUrl}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatAuction(auction: Auction): string {
  const statusColors: Record<string, (s: string) => string> = {
    'PENDING': pc.yellow,
    'ENABLED': pc.green,
    'ENDED': pc.gray,
    'SOLD': pc.blue,
  };
  const statusFn = statusColors[auction.status] || pc.white;
  const reserveEth = formatWeiToEth(auction.reservePrice);
  const startEth = formatWeiToEth(auction.startPrice);

  const lines = [
    pc.bold(`🔨 Auction #${auction.id}`),
    `Validator #${auction.nftTokenId}`,
    '',
    `${pc.dim('Status:')} ${statusFn(auction.status)}`,
    `${pc.dim('Token ID:')} ${auction.nftTokenId}`,
    `${pc.dim('Start Price:')} ${startEth} ETH`,
    `${pc.dim('Reserve Price:')} ${reserveEth} ETH`,
  ];

  if (auction.pricePaid) {
    lines.push(`${pc.dim('Sold For:')} ${pc.green(formatWeiToEth(auction.pricePaid) + ' ETH')}`);
  }

  const startTime = new Date(auction.startTime);
  lines.push(`${pc.dim('Starts:')} ${startTime.toLocaleString()}`);

  if (auction.buyerAddress) {
    const buyerName = auction.buyerUser?.username 
      ? `@${auction.buyerUser.username}` 
      : auction.buyerUser?.displayName || `${auction.buyerAddress.slice(0, 10)}...`;
    lines.push('', pc.green(`🏆 Winner: ${buyerName}`));
  }

  return lines.filter(Boolean).join('\n');
}

export function formatAuctions(auctions: Auction[], total: number): string {
  if (!auctions.length) {
    return pc.yellow('No auctions found.');
  }

  const lines = [pc.bold(`🎫 Validator Auctions (${total} total)`), ''];

  for (const a of auctions) {
    const statusColor = a.status === 'ENABLED' ? pc.green : a.status === 'SOLD' ? pc.blue : pc.yellow;
    const startEth = formatWeiToEth(a.startPrice);
    lines.push(`🎫 ${pc.bold(`Validator #${a.nftTokenId}`)} ${statusColor(`[${a.status}]`)}`);
    lines.push(`   ${pc.dim('Start Price:')} ${startEth} ETH`);
    if (a.pricePaid) {
      lines.push(`   ${pc.dim('Sold For:')} ${pc.green(formatWeiToEth(a.pricePaid) + ' ETH')}`);
    }
    if (a.buyerAddress) {
      const buyerName = a.buyerUser?.username 
        ? `@${a.buyerUser.username}` 
        : a.buyerUser?.displayName || `${a.buyerAddress.slice(0, 10)}...`;
      lines.push(`   ${pc.dim('Buyer:')} ${buyerName}`);
    }
    lines.push(`   ${pc.dim('Starts:')} ${new Date(a.startTime).toLocaleDateString()}`);
    lines.push('');
  }

  return lines.join('\n');
}

function formatWeiToEth(wei: string): string {
  const eth = Number(BigInt(wei)) / 1e18;
  if (eth >= 1) return eth.toFixed(4);
  if (eth >= 0.001) return eth.toFixed(6);
  return eth.toExponential(4);
}

export function formatMarket(market: Market): string {
  const name = market.user?.displayName || market.user?.username || 'Unknown';
  const priceChange = market.stats?.priceChange24hPercent || 0;
  const priceChangeColor = priceChange >= 0 ? pc.green : pc.red;
  const positivePrice = formatWeiToEth(market.positivePrice);
  const marketCap = formatWeiToEth(market.stats?.marketCapWei || '0');
  const totalHolders = market.trustVotes + market.distrustVotes;

  const lines = [
    pc.bold(pc.cyan(name)),
    market.user?.username ? pc.dim(`@${market.user.username}`) : '',
    '',
    `${pc.dim('Trust Price:')} ${positivePrice} ETH ${priceChangeColor(`(${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%)`)}`,
    `${pc.dim('Market Cap:')} ${marketCap} ETH`,
    `${pc.dim('Score:')} ${pc.green(String(market.user?.score || 0))}`,
    `${pc.dim('Trust/Distrust:')} ${pc.green(String(market.trustVotes))} / ${pc.red(String(market.distrustVotes))}`,
  ];

  if (market.stats?.volume24hWei) {
    lines.push(`${pc.dim('24h Volume:')} ${formatWeiToEth(market.stats.volume24hWei)} ETH`);
  }

  if (market.stats?.marketCapChange24hPercent !== undefined) {
    const mcChange = market.stats.marketCapChange24hPercent;
    const mcChangeColor = mcChange >= 0 ? pc.green : pc.red;
    lines.push(`${pc.dim('Market Cap 24h:')} ${mcChangeColor(`${mcChange >= 0 ? '+' : ''}${mcChange.toFixed(1)}%`)}`);
  }

  return lines.filter(Boolean).join('\n');
}

export function formatMarkets(markets: Market[], total: number): string {
  if (!markets.length) {
    return pc.yellow('No markets found.');
  }

  const lines = [pc.bold(`Trust Markets (${total} total)`), ''];

  for (const m of markets) {
    const name = m.user?.displayName || m.user?.username || 'Unknown';
    const priceChange = m.stats?.priceChange24hPercent || 0;
    const priceChangeColor = priceChange >= 0 ? pc.green : pc.red;
    const marketCap = formatWeiToEth(m.stats?.marketCapWei || '0');
    const totalHolders = m.trustVotes + m.distrustVotes;
    
    lines.push(`${pc.bold(name)} ${m.user?.username ? pc.dim('@' + m.user.username) : ''}`);
    lines.push(`   Cap: ${marketCap} ETH | ${priceChangeColor(`${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`)} | Score: ${m.user?.score || 0}`);
    lines.push(`   Trust: ${pc.green(String(m.trustVotes))} | Distrust: ${pc.red(String(m.distrustVotes))}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatMarketHolders(holders: MarketHolder[], total: number): string {
  if (!holders.length) {
    return pc.yellow('No holders found.');
  }

  const lines = [pc.bold(`Market Holders (${total} total)`), ''];

  for (const h of holders) {
    const name = h.user?.displayName || h.user?.username || 'Unknown';
    const voteColor = h.voteType === 'trust' ? pc.green : pc.red;
    const voteIcon = h.voteType === 'trust' ? '📈' : '📉';
    
    lines.push(`${voteIcon} ${pc.bold(name)} ${h.user?.username ? pc.dim('@' + h.user.username) : ''}`);
    lines.push(`   ${voteColor(h.voteType.toUpperCase())}: ${h.total} votes`);
    lines.push(`   Score: ${h.user?.score || 0}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatFeaturedMarkets(response: FeaturedMarketsResponse): string {
  if (!response.length) {
    return pc.yellow('No featured markets found.');
  }

  const lines = [pc.bold(pc.cyan('Featured Markets')), ''];

  const typeLabels: Record<string, { label: string; icon: string; color: (s: string) => string }> = {
    'top-volume': { label: 'Top Volume', icon: '📈', color: pc.green },
    'undervalued': { label: 'Undervalued', icon: '💎', color: pc.blue },
    'rugging': { label: 'Rugging', icon: '⚠️', color: pc.red },
  };

  for (const featured of response) {
    const m = featured.market;
    const typeInfo = typeLabels[featured.type] || { label: featured.type, icon: '📊', color: pc.white };
    const name = m.user?.displayName || m.user?.username || 'Unknown';
    const priceChange = m.stats?.priceChange24hPercent || 0;
    const marketCap = formatWeiToEth(m.stats?.marketCapWei || '0');
    const mcChange = m.stats?.marketCapChange24hPercent || 0;

    lines.push(`${typeInfo.icon} ${typeInfo.color(pc.bold(typeInfo.label))}`);
    lines.push(`   ${pc.bold(name)} ${m.user?.username ? pc.dim('@' + m.user.username) : ''}`);
    lines.push(`   Cap: ${marketCap} ETH (${mcChange >= 0 ? pc.green(`+${mcChange}%`) : pc.red(`${mcChange}%`)})`);
    lines.push(`   Score: ${m.user?.score || 0} | Price: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`);
    lines.push('');
  }

  return lines.join('\n');
}

const LEVEL_COLORS: Record<ScoreLevel, (s: string) => string> = {
  untrusted: pc.red,
  questionable: pc.yellow,
  neutral: pc.white,
  reputable: pc.green,
  exemplary: pc.cyan,
};

export function formatScore(data: ScoreResponse & { identifier?: string }): string {
  const levelColor = LEVEL_COLORS[data.level] || pc.white;
  const lines = [
    pc.bold(pc.cyan('Reputation Score')),
    '',
    `${pc.dim('Score:')} ${pc.green(String(data.score))}`,
    `${pc.dim('Level:')} ${levelColor(data.level.toUpperCase())}`,
  ];

  if (data.identifier) {
    lines.push(`${pc.dim('User:')} ${data.identifier}`);
  }

  return lines.join('\n');
}

export function formatScoreStatus(data: ScoreStatus & { identifier?: string }): string {
  const statusColor = data.status === 'idle' ? pc.green : data.status === 'calculating' ? pc.yellow : pc.blue;
  const lines = [
    pc.bold(pc.cyan('Score Calculation Status')),
    '',
    `${pc.dim('Status:')} ${statusColor(data.status.toUpperCase())}`,
  ];

  if (data.isPending) {
    lines.push(`${pc.dim('Pending:')} ${pc.yellow('Yes')} (${data.isCalculating ? 'calculating' : 'queued'})`);
  }

  if (data.identifier) {
    lines.push(`${pc.dim('User:')} ${data.identifier}`);
  }

  return lines.join('\n');
}

function formatVouchAmount(wei: string): string {
  const cleanWei = wei.replace(/n$/, '');
  const eth = Number(BigInt(cleanWei)) / 1e18;
  if (eth >= 1) return eth.toFixed(4) + ' ETH';
  if (eth >= 0.001) return eth.toFixed(6) + ' ETH';
  if (eth > 0) return eth.toExponential(2) + ' ETH';
  return '0 ETH';
}

export function formatVouch(vouch: Vouch): string {
  const authorName = vouch.authorUser?.username ? `@${vouch.authorUser.username}` : vouch.authorUser?.displayName || `Profile #${vouch.authorProfileId}`;
  const subjectName = vouch.subjectUser?.username ? `@${vouch.subjectUser.username}` : vouch.subjectUser?.displayName || `Profile #${vouch.subjectProfileId}`;
  const statusIcon = vouch.archived ? pc.gray('○ Archived') : vouch.unhealthy ? pc.yellow('⚠ Unhealthy') : pc.green('● Active');

  const lines = [
    pc.bold(`Vouch #${vouch.id}`),
    statusIcon,
    '',
    `${pc.dim('From:')} ${authorName}`,
    `${pc.dim('To:')} ${subjectName}`,
    `${pc.dim('Amount:')} ${pc.green(formatVouchAmount(vouch.balance))}`,
  ];

  if (vouch.mutualId) {
    lines.push(`${pc.dim('Mutual:')} Yes (Vouch #${vouch.mutualId})`);
  }

  if (vouch.comment) {
    lines.push('', pc.dim('Comment:'), vouch.comment.slice(0, 200) + (vouch.comment.length > 200 ? '...' : ''));
  }

  const vouchedAt = new Date(vouch.activityCheckpoints.vouchedAt * 1000);
  lines.push('', `${pc.dim('Vouched:')} ${vouchedAt.toLocaleDateString()}`);

  return lines.join('\n');
}

export function formatVouches(vouches: Vouch[], total: number): string {
  if (!vouches.length) {
    return pc.yellow('No vouches found.');
  }

  const lines = [pc.bold(`Vouches (${total} total)`), ''];

  for (const v of vouches) {
    const authorName = v.authorUser?.username ? `@${v.authorUser.username}` : v.authorUser?.displayName || `Profile #${v.authorProfileId}`;
    const subjectName = v.subjectUser?.username ? `@${v.subjectUser.username}` : v.subjectUser?.displayName || `Profile #${v.subjectProfileId}`;
    const statusIcon = v.archived ? pc.gray('○') : v.unhealthy ? pc.yellow('⚠') : pc.green('●');
    const mutualTag = v.mutualId ? pc.cyan(' [MUTUAL]') : '';

    lines.push(`${statusIcon} ${pc.bold('#' + v.id)} ${authorName} → ${subjectName}${mutualTag}`);
    lines.push(`   ${pc.dim('Amount:')} ${formatVouchAmount(v.balance)}`);
    if (v.comment) {
      const preview = v.comment.slice(0, 50) + (v.comment.length > 50 ? '...' : '');
      lines.push(`   ${pc.dim(preview)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatMutualVouchers(users: VouchUser[], total: number): string {
  if (!users.length) {
    return pc.yellow('No mutual vouchers found.');
  }

  const lines = [pc.bold(`Mutual Vouchers (${total} total)`), ''];

  for (const u of users) {
    const name = u.username ? `@${u.username}` : u.displayName || 'Unknown';
    lines.push(`🤝 ${pc.bold(name)}`);
    if (u.score !== undefined) {
      lines.push(`   ${pc.dim('Score:')} ${u.score}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatVotes(votes: Vote[], total: number, activityType?: string): string {
  if (!votes.length) {
    return pc.yellow('No votes found.');
  }

  const lines = [pc.bold(`Votes${activityType ? ` on ${activityType}` : ''} (${total} total)`), ''];

  for (const v of votes) {
    const voteIcon = v.isUpvote ? pc.green('👍') : pc.red('👎');
    const voterName = v.user.username ? `@${v.user.username}` : v.user.displayName || `Profile #${v.user.profileId}`;
    lines.push(`${voteIcon} ${pc.bold(voterName)} (Score: ${v.user.score})`);
    lines.push(`   ${pc.dim('Voted:')} ${new Date(v.createdAt * 1000).toLocaleDateString()}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatVoteStats(stats: VoteStats, activityType?: string, activityId?: number): string {
  const { upvotes, downvotes } = stats.counts;
  const total = upvotes + downvotes;

  const lines = [
    pc.bold(pc.cyan(`Vote Stats${activityId ? ` for ${activityType || 'Activity'} #${activityId}` : ''}`)),
    '',
    `${pc.green('👍 Upvotes:')} ${upvotes}`,
    `${pc.red('👎 Downvotes:')} ${downvotes}`,
    `${pc.dim('Total:')} ${total}`,
    `${pc.dim('Approval:')} ${stats.weights.upvotePercentage}%`,
  ];

  return lines.join('\n');
}

export function formatValidator(validator: Validator): string {
  const ownerName = validator.ownerUsername ? `@${validator.ownerUsername}` : validator.ownerDisplayName || `Profile #${validator.ownerProfileId}`;
  const capacityPercent = Math.round((validator.currentXp / validator.xpCap) * 100);
  const capacityColor = validator.isFull ? pc.red : capacityPercent > 80 ? pc.yellow : pc.green;

  const lines = [
    pc.bold(pc.cyan(`🎫 ${validator.name}`)),
    '',
    `${pc.dim('Token ID:')} ${validator.tokenId}`,
    `${pc.dim('Owner:')} ${ownerName}`,
    `${pc.dim('Owner Address:')} ${validator.ownerAddress.slice(0, 10)}...${validator.ownerAddress.slice(-8)}`,
    '',
    pc.bold('Delegated XP'),
    `${pc.dim('Current:')} ${validator.currentXp.toLocaleString()}`,
    `${pc.dim('Cap:')} ${validator.xpCap.toLocaleString()}`,
    `${pc.dim('Remaining:')} ${capacityColor(validator.remainingCapacity.toLocaleString())}`,
    `${pc.dim('Usage:')} ${capacityColor(`${capacityPercent}%`)}${validator.isFull ? pc.red(' (FULL)') : ''}`,
  ];

  return lines.join('\n');
}

export function formatValidators(validators: Validator[], total: number): string {
  if (!validators.length) {
    return pc.yellow('No validators found.');
  }

  const lines = [pc.bold(`🎫 Validators (${total} total)`), ''];

  for (const v of validators) {
    const ownerName = v.ownerUsername ? `@${v.ownerUsername}` : v.ownerDisplayName || 'Unknown';
    const capacityPercent = Math.round((v.currentXp / v.xpCap) * 100);
    const capacityColor = v.isFull ? pc.red : capacityPercent > 80 ? pc.yellow : pc.green;
    const fullTag = v.isFull ? pc.red(' [FULL]') : '';

    lines.push(`🎫 ${pc.bold(v.name)} (Token #${v.tokenId})${fullTag}`);
    lines.push(`   ${pc.dim('Owner:')} ${ownerName}`);
    lines.push(`   ${pc.dim('Delegated:')} ${v.currentXp.toLocaleString()} / ${v.xpCap.toLocaleString()} ${capacityColor(`(${capacityPercent}%)`)}`);
    lines.push('');
  }

  return lines.join('\n');
}
