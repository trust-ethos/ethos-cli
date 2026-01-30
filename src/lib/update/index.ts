import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, symlinkSync, readdirSync, rmSync } from 'fs';
import { homedir, platform, arch } from 'os';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const GITHUB_REPO = 'trust-ethos/ethos-cli';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ETHOS_HOME = join(homedir(), '.ethos');
const UPDATE_DIR = join(ETHOS_HOME, 'updates');
const VERSIONS_DIR = join(ETHOS_HOME, 'versions');
const CURRENT_LINK = join(ETHOS_HOME, 'current');
const CACHE_FILE = join(UPDATE_DIR, 'version-cache.json');
const PENDING_FILE = join(UPDATE_DIR, 'pending.json');

export interface VersionCache {
  latestVersion: string;
  checkedAt: number;
  downloadUrl?: string;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  downloadUrl?: string;
}

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface GitHubRelease {
  tag_name: string;
  assets: ReleaseAsset[];
}

export function getCurrentVersion(): string {
  try {
    const pkgPath = join(dirname(dirname(dirname(__dirname))), 'package.json');
    if (existsSync(pkgPath)) {
      return JSON.parse(readFileSync(pkgPath, 'utf-8')).version;
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
    'linux-x64': 'linux-x64',
    'linux-arm64': 'linux-arm64',
    'win32-x64': 'win32-x64',
  };

  return targetMap[`${os}-${architecture}`] || `${os}-${architecture}`;
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadCache(): VersionCache | null {
  try {
    if (existsSync(CACHE_FILE)) {
      return JSON.parse(readFileSync(CACHE_FILE, 'utf-8')) as VersionCache;
    }
  } catch {}
  return null;
}

function saveCache(cache: VersionCache): void {
  ensureDir(UPDATE_DIR);
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function isCacheValid(cache: VersionCache | null): boolean {
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
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ethos-cli',
        },
      }
    );
    
    if (!response.ok) return null;
    return await response.json() as GitHubRelease;
  } catch {
    return null;
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
      latestVersion: cache.latestVersion,
      updateAvailable: compareVersions(cache.latestVersion, currentVersion) > 0,
      downloadUrl: cache.downloadUrl,
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
    latestVersion,
    checkedAt: Date.now(),
    downloadUrl: asset?.browser_download_url,
  };
  saveCache(newCache);
  
  return {
    currentVersion,
    latestVersion,
    updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
    downloadUrl: asset?.browser_download_url,
  };
}

export function downloadUpdateInBackground(downloadUrl: string, version: string): void {
  ensureDir(UPDATE_DIR);
  ensureDir(VERSIONS_DIR);
  
  const tarballPath = join(UPDATE_DIR, `ethos-v${version}.tar.gz`);
  const extractDir = join(VERSIONS_DIR, `v${version}`);
  
  const script = `
    const https = require('https');
    const fs = require('fs');
    const { execSync } = require('child_process');
    const path = require('path');
    
    const url = '${downloadUrl}';
    const tarball = '${tarballPath}';
    const extractDir = '${extractDir}';
    const pendingFile = '${PENDING_FILE}';
    
    function download(url, dest, redirects = 0) {
      if (redirects > 5) process.exit(1);
      
      const file = fs.createWriteStream(dest);
      const protocol = url.startsWith('https') ? require('https') : require('http');
      
      protocol.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlinkSync(dest);
          download(response.headers.location, dest, redirects + 1);
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          try {
            fs.mkdirSync(extractDir, { recursive: true });
            execSync('tar -xzf ' + tarball + ' -C ' + extractDir + ' --strip-components=1', { stdio: 'ignore' });
            fs.unlinkSync(tarball);
            fs.writeFileSync(pendingFile, JSON.stringify({ version: '${version}', path: extractDir }));
          } catch (e) {
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
  
  const { spawn } = require('child_process');
  const child = spawn(process.execPath, ['-e', script], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

export function getPendingUpdate(): { version: string; path: string } | null {
  try {
    if (!existsSync(PENDING_FILE)) return null;
    
    const data = JSON.parse(readFileSync(PENDING_FILE, 'utf-8'));
    if (existsSync(data.path)) return data;
    
    unlinkSync(PENDING_FILE);
  } catch {}
  return null;
}

export function applyPendingUpdate(): boolean {
  const pending = getPendingUpdate();
  if (!pending) return false;
  
  const isDevMode = process.execPath.includes('bun') || process.execPath.includes('node');
  if (isDevMode) {
    try { unlinkSync(PENDING_FILE); } catch {}
    return false;
  }
  
  const isManagedInstall = process.execPath.startsWith(ETHOS_HOME);
  if (!isManagedInstall) {
    try { unlinkSync(PENDING_FILE); } catch {}
    return false;
  }
  
  try {
    if (existsSync(CURRENT_LINK)) unlinkSync(CURRENT_LINK);
    symlinkSync(pending.path, CURRENT_LINK);
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
        rmSync(verPath, { recursive: true, force: true });
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

export type InstallMethod = 'curl' | 'npm' | 'homebrew' | 'dev' | 'unknown';

export interface InstallInfo {
  method: InstallMethod;
  supportsAutoUpdate: boolean;
  updateCommand: string;
}

export function detectInstallMethod(): InstallInfo {
  const execPath = process.execPath;
  
  if (execPath.includes('bun') || execPath.includes('node')) {
    return {
      method: 'dev',
      supportsAutoUpdate: false,
      updateCommand: 'git pull && bun install && bun run build',
    };
  }
  
  if (execPath.startsWith(ETHOS_HOME)) {
    return {
      method: 'curl',
      supportsAutoUpdate: true,
      updateCommand: 'Updates automatically',
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
      updateCommand: 'npm update -g @ethos-network/cli',
    };
  }
  
  return {
    method: 'unknown',
    supportsAutoUpdate: false,
    updateCommand: 'Visit https://github.com/trust-ethos/ethos-cli for update instructions',
  };
}
