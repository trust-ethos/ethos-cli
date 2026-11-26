import { Hook } from '@oclif/core';
import { spawnSync } from 'node:child_process';
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
      // process.execPath is the (bundled) node binary, so the CLI entry script
      // must be passed explicitly. Re-executing with only process.argv.slice(2)
      // made node treat the first CLI argument as a filename, which always failed
      // and - because the failure was swallowed - silently dropped the user's
      // command while still exiting 0.
      const entryScript = process.argv[1];
      const args = process.argv.slice(2);
      // spawnSync without a shell: the previous implementation built a shell
      // command string and wrapped each argv entry in double quotes, which does
      // not neutralise shell substitution. Running `ethos user info '$(id)'`
      // right after an update landed would have executed `id`. Passing the argv
      // array directly means the user's arguments are never parsed by a shell.
      const result = spawnSync(
        process.execPath,
        entryScript ? [entryScript, ...args] : args,
        {
          env: { ...process.env, ETHOS_SKIP_UPDATE_CHECK: '1' },
          stdio: 'inherit',
        }
      );

      // Propagate the re-executed command's outcome instead of always reporting
      // success: callers and shell scripts rely on the exit code.
      // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit -- Exit after re-executing updated CLI
      process.exit(result.status ?? 1);
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
