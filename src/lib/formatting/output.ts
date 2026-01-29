/**
 * Output formatting utilities for human-readable and JSON output
 */

import pc from 'picocolors';

/**
 * Output data in either JSON or human-readable format based on flags
 */
export function output<T>(data: T, flags: { json?: boolean }): string {
  if (flags.json) {
    return JSON.stringify(data, null, 2);
  }

  // For non-JSON output, use custom formatters
  return JSON.stringify(data, null, 2);
}

/**
 * Format user profile for human-readable display
 */
export function formatUser(user: any): string {
  const lines = [
    pc.bold(pc.cyan(`User Profile: ${user.username || 'Unknown'}`)),
    '',
  ];

  if (user.id) {
    lines.push(`${pc.dim('ID:')} ${user.id}`);
  }

  if (user.address) {
    lines.push(`${pc.dim('Address:')} ${user.address}`);
  }

  if (user.score !== undefined) {
    lines.push(`${pc.dim('Reputation Score:')} ${pc.green(String(user.score))}`);
  }

  if (user.createdAt) {
    lines.push(`${pc.dim('Member Since:')} ${new Date(user.createdAt).toLocaleDateString()}`);
  }

  return lines.join('\n');
}

/**
 * Format XP balance for human-readable display
 */
export function formatXP(data: { totalXp: number; userkey?: string }): string {
  const lines = [
    pc.bold(pc.cyan('XP Balance')),
    '',
    `${pc.dim('Total XP:')} ${pc.green(data.totalXp.toLocaleString())}`,
  ];

  if (data.userkey) {
    lines.push(`${pc.dim('User:')} ${data.userkey}`);
  }

  return lines.join('\n');
}

/**
 * Format XP seasons list for human-readable display
 */
export function formatSeasons(seasons: any[]): string {
  if (!seasons || seasons.length === 0) {
    return pc.yellow('No seasons found');
  }

  const lines = [
    pc.bold(pc.cyan('XP Seasons')),
    '',
  ];

  for (const season of seasons) {
    const seasonId = season.id !== undefined ? season.id : season.season;
    lines.push(pc.bold(`Season ${seasonId}`));
    if (season.name) {
      lines.push(`  ${pc.dim('Name:')} ${season.name}`);
    }
    if (season.startDate) {
      lines.push(`  ${pc.dim('Start:')} ${new Date(season.startDate).toLocaleDateString()}`);
    }
    if (season.endDate) {
      lines.push(`  ${pc.dim('End:')} ${new Date(season.endDate).toLocaleDateString()}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format leaderboard rank for human-readable display
 */
export function formatRank(data: { rank: number; totalXp?: number; userkey?: string }): string {
  const lines = [
    pc.bold(pc.cyan('Leaderboard Rank')),
    '',
    `${pc.dim('Rank:')} ${pc.green(`#${data.rank.toLocaleString()}`)}`,
  ];

  if (data.totalXp !== undefined) {
    lines.push(`${pc.dim('Total XP:')} ${pc.green(data.totalXp.toLocaleString())}`);
  }

  if (data.userkey) {
    lines.push(`${pc.dim('User:')} ${data.userkey}`);
  }

  return lines.join('\n');
}

/**
 * Format search results for human-readable display
 */
export function formatSearchResults(results: any[]): string {
  if (!results || results.length === 0) {
    return pc.yellow('No users found');
  }

  const lines = [
    pc.bold(pc.cyan(`Search Results (${results.length} found)`)),
    '',
  ];

  for (const user of results) {
    lines.push(pc.bold(user.username || user.address || 'Unknown'));
    if (user.score !== undefined) {
      lines.push(`  ${pc.dim('Score:')} ${pc.green(String(user.score))}`);
    }
    if (user.address) {
      lines.push(`  ${pc.dim('Address:')} ${user.address}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
