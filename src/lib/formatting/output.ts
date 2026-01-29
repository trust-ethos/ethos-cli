import pc from 'picocolors';
import type { Activity, EthosUser, Season } from '../api/echo-client.js';

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

export function formatRank(data: { rank: number; totalXp?: number; userkey?: string; username?: string }): string {
  const lines = [
    pc.bold(pc.cyan('Leaderboard Rank')),
    '',
    `${pc.dim('Rank:')} ${pc.green(`#${data.rank.toLocaleString()}`)}`,
  ];

  if (data.totalXp !== undefined) {
    lines.push(`${pc.dim('Total XP:')} ${pc.green(data.totalXp.toLocaleString())}`);
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
