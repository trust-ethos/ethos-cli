import pc from 'picocolors';
import type { Activity, Auction, BrokerPost, EthosUser, FeaturedMarketsResponse, Market, MarketHolder, Project, ProjectVoter, ProjectVotersTotals, Season, Slash } from '../api/echo-client.js';

export function output<T>(data: T): string {
  return JSON.stringify(data, null, 2);
}

function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
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

  lines.push(`${pc.dim('Score:')} ${pc.green(String(user.score))}`);
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

export function formatXP(data: { totalXp: number; userkey?: string; username?: string }): string {
  const lines = [
    pc.bold(pc.cyan('XP Balance')),
    '',
    `${pc.dim('Total XP:')} ${pc.green(data.totalXp.toLocaleString())}`,
  ];

  if (data.username) {
    lines.push(`${pc.dim('User:')} ${data.username}`);
  } else if (data.userkey) {
    lines.push(`${pc.dim('Userkey:')} ${data.userkey}`);
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
    'pending': pc.yellow,
    'active': pc.green,
    'ended': pc.gray,
    'settled': pc.blue,
  };
  const statusFn = statusColors[auction.status] || pc.white;

  const lines = [
    pc.bold(`🔨 Auction #${auction.id}`),
    auction.name ? pc.cyan(auction.name) : '',
    '',
    `${pc.dim('Status:')} ${statusFn(auction.status.toUpperCase())}`,
    `${pc.dim('Token ID:')} ${auction.tokenId}`,
    `${pc.dim('Reserve Price:')} ${auction.reservePrice} ETH`,
  ];

  if (auction.currentBid) {
    lines.push(`${pc.dim('Current Bid:')} ${pc.green(auction.currentBid + ' ETH')}`);
    if (auction.currentBidder) {
      lines.push(`${pc.dim('Current Bidder:')} ${auction.currentBidder.slice(0, 10)}...`);
    }
  }

  lines.push(`${pc.dim('Bids:')} ${auction.bidsCount}`);

  if (auction.status === 'active') {
    const endTime = new Date(auction.endTime);
    lines.push(`${pc.dim('Ends:')} ${endTime.toLocaleString()}`);
  }

  if (auction.winner) {
    lines.push('', pc.green(`🏆 Winner: ${auction.winner.slice(0, 10)}...`));
    lines.push(`   Winning Bid: ${auction.winningBid} ETH`);
  }

  return lines.filter(Boolean).join('\n');
}

export function formatAuctions(auctions: Auction[], total: number): string {
   if (!auctions.length) {
     return pc.yellow('No auctions found.');
   }

   const lines = [pc.bold(`🎫 Validator Auctions (${total} total)`), ''];

   for (const a of auctions) {
     const statusColor = a.status === 'active' ? pc.green : a.status === 'ended' ? pc.red : pc.yellow;
     lines.push(`🎫 ${pc.bold(a.name || `Validator #${a.tokenId}`)} ${statusColor(`[${a.status.toUpperCase()}]`)}`);
     lines.push(`   ${pc.dim('Reserve:')} ${a.reservePrice} ETH`);
     if (a.currentBid) {
       lines.push(`   ${pc.dim('Current Bid:')} ${pc.green(a.currentBid + ' ETH')} ${pc.dim('by')} ${a.currentBidder?.slice(0, 10)}...`);
     }
     lines.push(`   ${pc.dim('Bids:')} ${a.bidsCount}`);
     lines.push(`   ${pc.dim('Ends:')} ${new Date(a.endTime).toLocaleDateString()}`);
     lines.push('');
   }

   return lines.join('\n');
}

export function formatMarket(market: Market): string {
  const name = market.displayName || market.username || 'Unknown';
  const priceChange = market.priceChange24hPercent || 0;
  const priceChangeColor = priceChange >= 0 ? pc.green : pc.red;

  const lines = [
    pc.bold(pc.cyan(name)),
    '',
    `${pc.dim('Price:')} ${market.price} ETH ${priceChangeColor(`(${priceChange >= 0 ? '+' : ''}${priceChange}%)`)}`,
    `${pc.dim('Market Cap:')} ${market.marketCap} ETH`,
    `${pc.dim('Holders:')} ${market.holdersCount}`,
  ];

  if (market.volume24h) {
    lines.push(`${pc.dim('24h Volume:')} ${market.volume24h} ETH`);
  }

  if (market.marketCapChange24hPercent !== undefined) {
    const mcChange = market.marketCapChange24hPercent;
    const mcChangeColor = mcChange >= 0 ? pc.green : pc.red;
    lines.push(`${pc.dim('Market Cap Change (24h):')} ${mcChangeColor(`${mcChange >= 0 ? '+' : ''}${mcChange}%`)}`);
  }

  return lines.join('\n');
}

export function formatMarkets(markets: Market[], total: number): string {
  if (!markets.length) {
    return pc.yellow('No markets found.');
  }

  const lines = [pc.bold(`📊 Markets (${total} total)`), ''];

  for (const m of markets) {
    const name = m.displayName || m.username || 'Unknown';
    const priceChange = m.priceChange24hPercent || 0;
    const priceChangeColor = priceChange >= 0 ? pc.green : pc.red;
    lines.push(`📊 ${pc.bold(name)}`);
    lines.push(`   ${pc.dim('Price:')} ${m.price} ETH ${priceChangeColor(`(${priceChange >= 0 ? '+' : ''}${priceChange}%)`)}`);
    lines.push(`   ${pc.dim('Market Cap:')} ${m.marketCap} ETH`);
    lines.push(`   ${pc.dim('Holders:')} ${m.holdersCount}`);
    if (m.volume24h) {
      lines.push(`   ${pc.dim('24h Volume:')} ${m.volume24h} ETH`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatMarketHolders(holders: MarketHolder[], total: number): string {
  if (!holders.length) {
    return pc.yellow('No holders found.');
  }

  const lines = [pc.bold(`👥 Market Holders (${total} total)`), ''];

  for (const h of holders) {
    const name = h.displayName || h.username || 'Unknown';
    const netPosition = parseFloat(h.netPosition);
    const netColor = netPosition >= 0 ? pc.green : pc.red;
    lines.push(`👥 ${pc.bold(name)}`);
    lines.push(`   ${pc.dim('Trust Balance:')} ${h.trustBalance}`);
    lines.push(`   ${pc.dim('Distrust Balance:')} ${h.distrustBalance}`);
    lines.push(`   ${pc.dim('Net Position:')} ${netColor(h.netPosition)}`);
    lines.push(`   ${pc.dim('Percentage:')} ${h.percentage}%`);
    lines.push('');
  }

  return lines.join('\n');
}

export function formatFeaturedMarkets(response: FeaturedMarketsResponse): string {
  const lines = [pc.bold(pc.cyan('Featured Markets')), ''];

  if (response.topGainers && response.topGainers.length > 0) {
    lines.push(pc.bold(pc.green('🚀 Top Gainers')));
    for (const m of response.topGainers) {
      const name = m.displayName || m.username || 'Unknown';
      const priceChange = m.priceChange24hPercent || 0;
      lines.push(`  ${pc.bold(name)} ${pc.green(`+${priceChange}%`)}`);
      lines.push(`    Price: ${m.price} ETH | Market Cap: ${m.marketCap} ETH`);
    }
    lines.push('');
  }

  if (response.topLosers && response.topLosers.length > 0) {
    lines.push(pc.bold(pc.red('📉 Top Losers')));
    for (const m of response.topLosers) {
      const name = m.displayName || m.username || 'Unknown';
      const priceChange = m.priceChange24hPercent || 0;
      lines.push(`  ${pc.bold(name)} ${pc.red(`${priceChange}%`)}`);
      lines.push(`    Price: ${m.price} ETH | Market Cap: ${m.marketCap} ETH`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
