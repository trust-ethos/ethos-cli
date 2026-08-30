import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { arch, homedir, platform } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_REPO = 'trust-ethos/ethos-cli';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ETHOS_HOME = join(homedir(), '.ethos');
const UPDATE_DIR = join(ETHOS_HOME, 'updates');
const VERSIONS_DIR = join(ETHOS_HOME, 'versions');
const CURRENT_LINK = join(ETHOS_HOME, 'current');
const SAFE_BIN_DIR = join(ETHOS_HOME, 'bin');
const CACHE_FILE = join(UPDATE_DIR, 'version-cache.json');
const PENDING_FILE = join(UPDATE_DIR, 'pending.json');

export interface VersionCache {
  checkedAt: number;
  downloadUrl?: string;
  latestVersion: string;
}

export interface UpdateInfo {
  currentVersion: string;
  downloadUrl?: string;
  latestVersion: string;
  updateAvailable: boolean;
}

export interface ReleaseAsset {
  browser_download_url: string;
  name: string;
}

export interface GitHubRelease {
  assets: ReleaseAsset[];
  tag_name: string;
}

/**
 * Hosts that are allowed to serve release tarballs.
 *
 * The download URL reaches us from two places we do not fully control: the GitHub
 * releases API response and the on-disk version cache in ~/.ethos/updates. Either
 * can be tampered with (a spoofed/compromised API response, or any local process
 * that can write to the user's home directory). Because the downloaded archive is
 * extracted and then symlinked as the CLI that the user executes, an attacker who
 * controls the URL controls code execution. Restricting the URL to HTTPS on
 * GitHub's own release-serving hosts is the minimum check that must pass before we
 * hand the value to a child process.
 */
const TRUSTED_RELEASE_HOSTS = new Set([
  'api.github.com',
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
]);

/**
 * Returns true only for an absolute HTTPS URL served by a trusted GitHub host.
 * Plain HTTP is rejected outright: without TLS the archive can be swapped in
 * transit, and we have no checksum to fall back on.
 */
export function isTrustedReleaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && TRUSTED_RELEASE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Returns true for a plain semver-ish version string.
 *
 * The version comes from the release tag name and is used to build filesystem
 * paths, so it must not contain path separators, traversal sequences, or shell
 * metacharacters.
 */
export function isSafeVersionString(version: string): boolean {
  return /^[\w][\w.+-]{0,63}$/.test(version) && !version.includes('..');
}

export function getCurrentVersion(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(dirname(dirname(dirname(currentDir))), 'package.json');
    if (existsSync(pkgPath)) {
      return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
    }
  } catch {}

  return '0.0.0';
}

function getPlatformTarget(): string {
  const os = platform();
  const architecture = arch();
  
  const targetMap: Record<string, string> = {
    'darwin-arm64': 'darwin-arm64',
    'darwin-x64': 'darwin-x64',
    'linux-arm64': 'linux-arm64',
    'linux-x64': 'linux-x64',
    'win32-x64': 'win32-x64',
  };

  return targetMap[`${os}-${architecture}`] || `${os}-${architecture}`;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function refreshEthosBinSymlink(): void {
  ensureDir(SAFE_BIN_DIR);
  const symlinkPath = join(SAFE_BIN_DIR, 'ethos');
  const target = join(CURRENT_LINK, 'bin', 'ethos');
  try {
    if (existsSync(symlinkPath)) unlinkSync(symlinkPath);
    symlinkSync(target, symlinkPath);
  } catch {}
}

function loadCache(): null | VersionCache {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as VersionCache;
    }
  } catch {}

  return null;
}

function saveCache(cache: VersionCache): void {
  ensureDir(UPDATE_DIR);
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function isCacheValid(cache: null | VersionCache): boolean {
  if (!cache) return false;
  return Date.now() - cache.checkedAt < CACHE_TTL_MS;
}

export function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/, '').split('.').map(Number);
  const partsB = b.replace(/^v/, '').split('.').map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  // This runs on every CLI invocation from the init hook. Without a timeout a
  // hung or throttled connection keeps the process alive (and the socket open)
  // long after the user's command has produced its output.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ethos-cli',
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) return null;
    return await response.json() as GitHubRelease;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function findAssetForPlatform(assets: ReleaseAsset[]): ReleaseAsset | undefined {
  const target = getPlatformTarget();
  return assets.find(a => a.name.includes(target) && a.name.endsWith('.tar.gz'));
}

export async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion();
  const cache = loadCache();
  
  if (isCacheValid(cache) && cache) {
    return {
      currentVersion,
      downloadUrl: cache.downloadUrl,
      latestVersion: cache.latestVersion,
      updateAvailable: compareVersions(cache.latestVersion, currentVersion) > 0,
    };
  }
  
  const release = await fetchLatestRelease();
  if (!release) {
    return {
      currentVersion,
      latestVersion: currentVersion,
      updateAvailable: false,
    };
  }
  
  const latestVersion = release.tag_name.replace(/^v/, '');
  const asset = findAssetForPlatform(release.assets);
  
  const newCache: VersionCache = {
    checkedAt: Date.now(),
    downloadUrl: asset?.browser_download_url,
    latestVersion,
  };
  saveCache(newCache);
  
  return {
    currentVersion,
    downloadUrl: asset?.browser_download_url,
    latestVersion,
    updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
  };
}

/**
 * Source of the detached background updater.
 *
 * All variable data is read from the environment rather than interpolated into
 * this string. Interpolating the download URL or version into the script body
 * would let a single quote character in either value terminate the surrounding
 * string literal and append arbitrary JavaScript, which `node -e` would then
 * execute with the user's privileges. Since the URL originates from the GitHub
 * API response or the local (writable) version cache, that was a real code
 * execution path, not a theoretical one.
 */
const BACKGROUND_UPDATER_SCRIPT = `
  const https = require('https');
  const fs = require('fs');
  const { execFileSync } = require('child_process');

  const url = process.env.ETHOS_UPDATE_URL;
  const tarball = process.env.ETHOS_UPDATE_TARBALL;
  const extractDir = process.env.ETHOS_UPDATE_EXTRACT_DIR;
  const pendingFile = process.env.ETHOS_UPDATE_PENDING_FILE;
  const version = process.env.ETHOS_UPDATE_VERSION;

  // Kept in sync with TRUSTED_RELEASE_HOSTS in src/lib/update/index.ts. Redirect
  // targets must be re-validated: GitHub redirects release downloads to its CDN,
  // and an attacker-controlled redirect would otherwise bypass the initial check.
  const TRUSTED_HOSTS = new Set([
    'api.github.com',
    'github.com',
    'objects.githubusercontent.com',
    'release-assets.githubusercontent.com',
  ]);

  function isTrusted(candidate) {
    try {
      const parsed = new URL(candidate);
      return parsed.protocol === 'https:' && TRUSTED_HOSTS.has(parsed.hostname);
    } catch {
      return false;
    }
  }

  if (!url || !tarball || !extractDir || !pendingFile || !version || !isTrusted(url)) {
    process.exit(1);
  }

  function download(current, dest, redirects = 0) {
    if (redirects > 5 || !isTrusted(current)) process.exit(1);

    const file = fs.createWriteStream(dest);

    // Always https: isTrusted() has already rejected any other protocol, so an
    // http:// download (which is tamper-able in transit) can never be reached.
    https.get(current, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        file.close();
        fs.unlinkSync(dest);
        const next = new URL(response.headers.location, current).toString();
        download(next, dest, redirects + 1);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        file.close();
        fs.unlink(dest, () => {});
        process.exit(1);
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        try {
          fs.mkdirSync(extractDir, { recursive: true });
          // execFileSync with an argument array: no shell is involved, so the
          // paths cannot be reinterpreted as commands.
          execFileSync('tar', ['-xzf', tarball, '-C', extractDir, '--strip-components=1'], { stdio: 'ignore' });
          fs.unlinkSync(tarball);
          fs.writeFileSync(pendingFile, JSON.stringify({ version, path: extractDir }));
        } catch {
          process.exit(1);
        }
      });
    }).on('error', () => {
      fs.unlink(dest, () => {});
      process.exit(1);
    });
  }

  download(url, tarball);
`;

export function downloadUpdateInBackground(downloadUrl: string, version: string): void {
  // Fail closed before spawning anything. A rejected URL or version means the
  // release metadata (or the cache holding it) is not something we should act on.
  if (!isTrustedReleaseUrl(downloadUrl) || !isSafeVersionString(version)) return;

  ensureDir(UPDATE_DIR);
  ensureDir(VERSIONS_DIR);

  const tarballPath = join(UPDATE_DIR, `ethos-v${version}.tar.gz`);
  const extractDir = join(VERSIONS_DIR, `v${version}`);

  const child = spawn(process.execPath, ['-e', BACKGROUND_UPDATER_SCRIPT], {
    detached: true,
    env: {
      ...process.env,
      ETHOS_UPDATE_EXTRACT_DIR: extractDir,
      ETHOS_UPDATE_PENDING_FILE: PENDING_FILE,
      ETHOS_UPDATE_TARBALL: tarballPath,
      ETHOS_UPDATE_URL: downloadUrl,
      ETHOS_UPDATE_VERSION: version,
    },
    stdio: 'ignore',
  });
  child.unref();
}

/**
 * Returns true when `candidate` resolves to a directory inside VERSIONS_DIR.
 *
 * pending.json lives in the user's home directory and is therefore writable by
 * any process running as the user. `applyPendingUpdate` turns the path it names
 * into the ~/.ethos/current symlink, which is what the `ethos` launcher executes,
 * so an unvalidated path is a straight code-execution primitive. Confining it to
 * the versions directory means only content this updater downloaded and extracted
 * can be promoted to "current".
 */
function isManagedVersionPath(candidate: string): boolean {
  const resolvedRoot = resolve(VERSIONS_DIR);
  const resolvedCandidate = resolve(candidate);
  return resolvedCandidate.startsWith(resolvedRoot + sep);
}

export function getPendingUpdate(): null | { path: string; version: string; } {
  try {
    if (!existsSync(PENDING_FILE)) return null;

    const data = JSON.parse(readFileSync(PENDING_FILE, 'utf8'));
    if (
      typeof data?.path === 'string' &&
      typeof data?.version === 'string' &&
      isSafeVersionString(data.version) &&
      isManagedVersionPath(data.path) &&
      existsSync(data.path)
    ) {
      return { path: data.path, version: data.version };
    }

    unlinkSync(PENDING_FILE);
  } catch {}

  return null;
}

export function applyPendingUpdate(): boolean {
  const pending = getPendingUpdate();
  if (!pending) return false;
  
  // Check managed install FIRST (bundled node path contains 'node')
  const isManagedInstall = process.execPath.startsWith(ETHOS_HOME);
  if (!isManagedInstall) {
    try { unlinkSync(PENDING_FILE); } catch {}
    return false;
  }
  
  try {
    if (existsSync(CURRENT_LINK)) unlinkSync(CURRENT_LINK);
    symlinkSync(pending.path, CURRENT_LINK);
    refreshEthosBinSymlink();
    unlinkSync(PENDING_FILE);
    cleanupOldVersions(pending.version);
    return true;
  } catch {
    return false;
  }
}

function cleanupOldVersions(keepVersion: string): void {
  try {
    if (!existsSync(VERSIONS_DIR)) return;
    
    const versions = readdirSync(VERSIONS_DIR);
    for (const ver of versions) {
      if (ver !== `v${keepVersion}` && ver !== keepVersion) {
        const verPath = join(VERSIONS_DIR, ver);
        rmSync(verPath, { force: true, recursive: true });
      }
    }
  } catch {}
}

export function clearUpdateData(): void {
  try {
    if (existsSync(CACHE_FILE)) unlinkSync(CACHE_FILE);
    if (existsSync(PENDING_FILE)) unlinkSync(PENDING_FILE);
  } catch {}
}

export function getInstallPath(): string {
  return ETHOS_HOME;
}

export type InstallMethod = 'curl' | 'dev' | 'homebrew' | 'npm' | 'unknown';

export interface InstallInfo {
  method: InstallMethod;
  supportsAutoUpdate: boolean;
  updateCommand: string;
}

export function detectInstallMethod(): InstallInfo {
  const {execPath} = process;
  
  // Check managed install FIRST (curl installer puts binaries in ~/.ethos/)
  if (execPath.startsWith(ETHOS_HOME)) {
    return {
      method: 'curl',
      supportsAutoUpdate: true,
      updateCommand: 'Updates automatically',
    };
  }
  
  // Dev mode: running via system node/bun (not bundled)
  if (execPath.includes('bun') || execPath.includes('/node')) {
    return {
      method: 'dev',
      supportsAutoUpdate: false,
      updateCommand: 'git pull && bun install && bun run build',
    };
  }
  
  if (execPath.includes('/homebrew/') || execPath.includes('/Cellar/')) {
    return {
      method: 'homebrew',
      supportsAutoUpdate: false,
      updateCommand: 'brew upgrade ethos',
    };
  }
  
  if (execPath.includes('node_modules') || execPath.includes('npm') || execPath.includes('npx')) {
    return {
      method: 'npm',
      supportsAutoUpdate: false,
      updateCommand: 'npm update -g @trust-ethos/cli',
    };
  }
  
  return {
    method: 'unknown',
    supportsAutoUpdate: false,
    updateCommand: 'Visit https://github.com/trust-ethos/ethos-cli for update instructions',
  };
}
