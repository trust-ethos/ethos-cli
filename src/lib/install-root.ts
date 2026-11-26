import { homedir } from 'node:os';
import { join, normalize, relative, resolve } from 'node:path';

export { sep as PATH_SEP } from 'node:path';

/**
 * The public `ethos` CLI's curl installer manages `~/.ethos/` as a
 * binary install root. This module is the single source of truth for
 * which sub-paths the CLI is allowed to create, modify, or remove —
 * a hard boundary so future "broken install -> wipe and reinstall"
 * paths cannot eat ethosdev wallet keys (or anything else a contributor
 * adds outside the contract).
 *
 * See docs/filesystem-layout.md for the cross-CLI ownership doc.
 */

export const ETHOS_HOME = join(homedir(), '.ethos');

/**
 * Sub-paths the public CLI owns inside `~/.ethos/`.
 *
 * Adding a new entry is a contract change — also update
 * `docs/filesystem-layout.md` and the regression test in
 * `test/lib/install-root.test.ts`.
 */
export const MANAGED_SUBPATHS = [
  'current',   // symlink: active version
  'bin',       // PATH-friendly binary symlink dir
  'versions',  // unpacked version trees
  'updates',   // download cache + pending update marker
  'cache',     // future cache (reserved)
] as const;

export type ManagedSubpath = (typeof MANAGED_SUBPATHS)[number];

const MANAGED_ABS = MANAGED_SUBPATHS.map((s) => join(ETHOS_HOME, s));

function isPathInside(child: string, parent: string): boolean {
  const rel = relative(parent, child);

  return rel === '' || (!rel.startsWith('..') && !resolve(parent, rel).startsWith('..'));
}

/**
 * True iff `p` resolves to ETHOS_HOME itself or to a descendant of one of
 * the MANAGED_SUBPATHS. Used to guard install/cleanup operations.
 */
export function isAllowedInstallPath(p: string): boolean {
  const abs = resolve(normalize(p));

  if (abs === ETHOS_HOME) return true;

  return MANAGED_ABS.some((root) => isPathInside(abs, root));
}

/**
 * Throw if `p` is not inside the documented contract. Use as a guard
 * before any destructive operation (rmSync, unlinkSync, etc.).
 */
export function assertAllowedInstallPath(p: string, op: string): void {
  if (!isAllowedInstallPath(p)) {
    throw new Error(
      `Refusing to ${op} path outside the public CLI install contract: ${p}\n` +
        `Allowed sub-paths under ${ETHOS_HOME}: ${MANAGED_SUBPATHS.join(', ')}\n` +
        `See docs/filesystem-layout.md.`,
    );
  }
}

/**
 * Pure helper for tests + reviewer audit: list every path the cleanup +
 * install code is allowed to touch. If you need to mutate a new sub-path,
 * add it to MANAGED_SUBPATHS first; otherwise the assert will trip in
 * production and tests.
 */
export function listManagedRoots(): readonly string[] {
  return MANAGED_ABS;
}

