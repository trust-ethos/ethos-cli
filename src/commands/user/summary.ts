import { Args, Command, Flags } from '@oclif/core';
import pc from 'picocolors';
import { EchoClient } from '../../lib/api/echo-client.js';
import { formatError } from '../../lib/formatting/error.js';
import { output } from '../../lib/formatting/output.js';

type ScoreLevel = 'untrusted' | 'questionable' | 'neutral' | 'reputable' | 'exemplary';

function getScoreLevel(score: number): ScoreLevel {
  if (score < 800) return 'untrusted';
  if (score < 1200) return 'questionable';
  if (score < 1600) return 'neutral';
  if (score < 2000) return 'reputable';
  return 'exemplary';
}

const LEVEL_COLORS: Record<ScoreLevel, (s: string) => string> = {
  untrusted: pc.red,
  questionable: pc.yellow,
  neutral: pc.white,
  reputable: pc.green,
  exemplary: pc.cyan,
};

export default class UserSummary extends Command {
  static args = {
    identifier: Args.string({
      description: 'Twitter username, ETH address, or ENS name',
      required: true,
    }),
  };

  static description = 'Display comprehensive user summary with activity and vouches';

  static examples = [
    '<%= config.bin %> <%= command.id %> sethgho',
    '<%= config.bin %> <%= command.id %> 0xNowater',
    '<%= config.bin %> <%= command.id %> vitalik.eth --json',
  ];

  static flags = {
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed error information',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UserSummary);
    const client = new EchoClient();

    try {
      const user = await client.resolveUser(args.identifier);
      const userkey = client.getPrimaryUserkey(user);

      const [activities, vouches] = await Promise.all([
        userkey ? client.getActivities(userkey, ['review', 'vouch'], 5) : [],
        user.profileId ? client.getVouches({ subjectProfileIds: [user.profileId], archived: false, limit: 5 }) : { values: [], total: 0 },
      ]);

      if (flags.json) {
        this.log(output({
          user,
          recentActivity: activities,
          topVouches: vouches.values,
        }));
        return;
      }

      const displayName = user.displayName || user.username || 'Unknown';
      const level = getScoreLevel(user.score);
      const levelColor = LEVEL_COLORS[level];

      const lines = [
        pc.bold(pc.cyan(`User Summary: ${displayName}`)),
        '',
      ];

      if (user.username) {
        lines.push(`${pc.dim('Username:')} @${user.username}`);
      }

      lines.push(`${pc.dim('Score:')} ${pc.green(String(user.score))} ${levelColor(`(${level.toUpperCase()})`)}`);
      lines.push(`${pc.dim('XP:')} ${pc.green(user.xpTotal.toLocaleString())}`);

      if (user.stats) {
        const reviews = user.stats.review.received;
        const reviewTotal = reviews.positive + reviews.neutral + reviews.negative;
        if (reviewTotal > 0) {
          lines.push(`${pc.dim('Reviews:')} ${pc.green(`+${reviews.positive}`)} / ${reviews.neutral} / ${pc.red(`-${reviews.negative}`)}`);
        }

        const vouches = user.stats.vouch;
        lines.push(`${pc.dim('Vouches:')} ${vouches.received.count} received, ${vouches.given.count} given`);
      }

      if (activities.length > 0) {
        lines.push('');
        lines.push(pc.bold('Recent Activity'));
        for (const activity of activities.slice(0, 5)) {
          const typeIcon = activity.type === 'vouch' ? '🤝' : activity.type === 'review' ? '📝' : '❌';
          const authorName = activity.author.username ? `@${activity.author.username}` : activity.author.name;
          const subjectName = activity.subject.username ? `@${activity.subject.username}` : activity.subject.name;
          const date = new Date(activity.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          lines.push(`  ${typeIcon} ${authorName} → ${subjectName} ${pc.dim(`(${date})`)}`);
        }
      }

      if (vouches.values.length > 0) {
        lines.push('');
        lines.push(pc.bold('Top Vouchers'));
        for (const v of vouches.values.slice(0, 5)) {
          const authorName = v.authorUser?.username ? `@${v.authorUser.username}` : v.authorUser?.displayName || `#${v.authorProfileId}`;
          const amount = formatVouchAmount(v.balance);
          const mutualTag = v.mutualId ? pc.cyan(' [MUTUAL]') : '';
          lines.push(`  🤝 ${authorName} - ${pc.green(amount)}${mutualTag}`);
        }
      }

      if (user.links?.profile) {
        lines.push('');
        lines.push(`${pc.dim('Profile:')} ${user.links.profile}`);
      }

      this.log(lines.join('\n'));
    } catch (error) {
      if (error instanceof Error) {
        this.log(formatError(error, flags.verbose));
        this.exit(1);
      }
    }
  }
}

function formatVouchAmount(wei: string): string {
  const cleanWei = wei.replace(/n$/, '');
  const eth = Number(BigInt(cleanWei)) / 1e18;
  if (eth >= 1) return eth.toFixed(4) + ' ETH';
  if (eth >= 0.001) return eth.toFixed(6) + ' ETH';
  if (eth > 0) return eth.toExponential(2) + ' ETH';
  return '0 ETH';
}
