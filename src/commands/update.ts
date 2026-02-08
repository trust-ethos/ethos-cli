import { Command, Flags } from '@oclif/core';
import { execSync } from 'node:child_process';
import pc from 'picocolors';

import {
  checkForUpdate,
  detectInstallMethod,
  getInstallPath,
  refreshEthosBinSymlink,
} from '../lib/update/index.js';

export default class Update extends Command {
  static description = 'Update the CLI to the latest version';
static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --force',
  ];
static flags = {
    force: Flags.boolean({ char: 'f', description: 'Force update even if already on latest' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Update);
    const installInfo = detectInstallMethod();

    this.log('');
    this.log(pc.dim(`Install method: ${installInfo.method}`));

    const updateInfo = await checkForUpdate();
    
    if (!updateInfo.updateAvailable && !flags.force) {
      this.log(pc.green(`Already on latest version (v${updateInfo.currentVersion})`));
      return;
    }

    if (updateInfo.updateAvailable) {
      this.log(`Update available: ${pc.yellow(`v${updateInfo.currentVersion}`)} → ${pc.green(`v${updateInfo.latestVersion}`)}`);
    }

    switch (installInfo.method) {
      case 'curl': {
        await this.updateCurl(updateInfo.latestVersion, updateInfo.downloadUrl);
        break;
      }

      case 'dev': {
        this.log(pc.yellow('Development install detected.'));
        this.log(pc.dim('Run: git pull && bun install && bun run build'));
        break;
      }

      case 'homebrew': {
        this.updateHomebrew();
        break;
      }

      case 'npm': {
        this.updateNpm();
        break;
      }

      default: {
        this.log(pc.yellow('Unknown install method.'));
        this.log(pc.dim('Visit https://github.com/trust-ethos/ethos-cli for update instructions'));
      }
    }
  }

  private async updateCurl(version: string, downloadUrl?: string): Promise<void> {
    if (!downloadUrl) {
      this.log(pc.red('Could not find download URL'));
      return;
    }

    const installPath = getInstallPath();
    
    this.log(`Downloading v${version}...`);
    
    try {
      const tarball = `/tmp/ethos-v${version}.tar.gz`;
      const extractDir = `${installPath}/versions/v${version}`;
      
      execSync(`curl -fsSL "${downloadUrl}" -o "${tarball}"`, { stdio: 'inherit' });
      execSync(`mkdir -p "${extractDir}"`, { stdio: 'ignore' });
      execSync(`tar -xzf "${tarball}" -C "${extractDir}" --strip-components=1`, { stdio: 'ignore' });
      execSync(`rm -f "${tarball}"`, { stdio: 'ignore' });
      execSync(`rm -f "${installPath}/current"`, { stdio: 'ignore' });
      execSync(`ln -sf "${extractDir}" "${installPath}/current"`, { stdio: 'ignore' });
      refreshEthosBinSymlink();
      
      this.log(pc.green(`Updated to v${version}`));
      this.log(pc.dim('Restart your terminal or run a new ethos command to use the new version.'));
    } catch {
      this.log(pc.red('Update failed. Try reinstalling:'));
      this.log(pc.dim('curl -fsSL https://raw.githubusercontent.com/trust-ethos/ethos-cli/main/scripts/install.sh | sh'));
    }
  }

  private updateHomebrew(): void {
    this.log('Updating via Homebrew...');
    try {
      execSync('brew upgrade ethos', { stdio: 'inherit' });
      this.log(pc.green('Update complete!'));
    } catch {
      this.log(pc.red('Update failed. Try running manually:'));
      this.log(pc.dim('brew upgrade ethos'));
    }
  }

  private updateNpm(): void {
    this.log('Updating via npm...');
    try {
      execSync('npm update -g @trust-ethos/cli', { stdio: 'inherit' });
      this.log(pc.green('Update complete!'));
    } catch {
      this.log(pc.red('Update failed. Try running manually:'));
      this.log(pc.dim('npm update -g @trust-ethos/cli'));
    }
  }
}
