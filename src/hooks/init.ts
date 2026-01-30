import { Hook } from '@oclif/core';
import { execSync } from 'child_process';
import pc from 'picocolors';
import {
  applyPendingUpdate,
  checkForUpdate,
  detectInstallMethod,
  downloadUpdateInBackground,
  getPendingUpdate,
} from '../lib/update/index.js';

const hook: Hook<'init'> = async function () {
  const pending = getPendingUpdate();
  
  if (pending) {
    const applied = applyPendingUpdate();
    if (applied) {
      this.log(pc.green(`Updated to v${pending.version}`));
      const args = process.argv.slice(2);
      try {
        execSync(`"${process.execPath}" ${args.map(a => `"${a}"`).join(' ')}`, { 
          stdio: 'inherit',
          env: { ...process.env, ETHOS_SKIP_UPDATE_CHECK: '1' },
        });
      } catch {}
      process.exit(0);
    }
  }
  
  if (process.env.ETHOS_SKIP_UPDATE_CHECK === '1') return;
  
  const installInfo = detectInstallMethod();
  
  checkForUpdate()
    .then((info) => {
      if (!info.updateAvailable) return;
      
      if (installInfo.supportsAutoUpdate && info.downloadUrl) {
        downloadUpdateInBackground(info.downloadUrl, info.latestVersion);
      } else if (installInfo.method !== 'dev') {
        this.log('');
        this.log(pc.yellow(`Update available: v${info.currentVersion} → v${info.latestVersion}`));
        this.log(pc.dim(`Run: ${installInfo.updateCommand}`));
        this.log('');
      }
    })
    .catch(() => {});
};

export default hook;
