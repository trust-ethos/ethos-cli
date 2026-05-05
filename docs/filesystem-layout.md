# Filesystem layout

This is the cross-CLI ownership contract for the public `ethos` CLI and
the monorepo developer CLI (`ethosdev`, in `trust-ethos/ethos`). Both
projects honor it; this doc is the source of truth.

## TL;DR

| Path                         | Owner       | Purpose                                  |
| ---------------------------- | ----------- | ---------------------------------------- |
| `~/.ethos/`                  | public CLI  | **Install root only**, no user state     |
| `~/.config/ethos/`           | public CLI  | User config                              |
| `~/.cache/ethos/`            | public CLI  | Cache (downloads, lookups)               |
| `~/.config/ethosdev/`        | ethosdev    | User-edited dev env                      |
| `~/.local/share/ethosdev/`   | ethosdev    | Secret state (wallets), 0600             |

`~/.ethos/` is reserved for the public CLI's curl-installer managed install
tree. Nothing else should land there. The previous monorepo CLI (`@ethos/cli`,
since renamed to `ethosdev`) wrote `~/.ethos/.wallets.json` and
`~/.ethos/ethos.env`; ethosdev migrates those to the XDG layout above on
first run.

## Public CLI sub-paths under `~/.ethos/`

The CLI is allowed to create, modify, and remove paths under exactly these
sub-directories — and nothing else:

| Sub-path                | Contents                                            |
| ----------------------- | --------------------------------------------------- |
| `~/.ethos/current`      | Symlink to active version dir                       |
| `~/.ethos/bin/`         | PATH-friendly binary symlinks (`ethos` -> current)  |
| `~/.ethos/versions/`    | Unpacked version trees (`v1.2.3/`, etc.)            |
| `~/.ethos/updates/`     | Download cache + pending-update marker              |
| `~/.ethos/cache/`       | Reserved for future cache use                       |

The contract is enforced in code:

- `src/lib/install-root.ts` exports `isAllowedInstallPath(p)` and
  `assertAllowedInstallPath(p, op)`. Every destructive operation
  (cleanup of old versions, cache eviction, pending-marker removal,
  install/uninstall) routes through `assertAllowedInstallPath` so a
  future code change that strays outside the contract trips loudly
  in tests + production rather than silently wiping state.

- `test/lib/install-root.test.ts` pins the exact list of allowed
  sub-paths. **Adding or removing a sub-path is a contract change.**
  Update the table above, the `MANAGED_SUBPATHS` constant, and the
  test assertion together.

## Why

Without an enforced contract, a future "broken install -- wipe and
reinstall" branch could eat ethosdev's wallet keys (or any other state a
contributor adds to `~/.ethos/`). Wallet keys are unrecoverable; this is
the kind of thing worth fixing before the bug exists, not after.

The narrow allowlist also gives reviewers a single small file to audit
when the install/update logic changes.

## ethosdev XDG layout

`ethosdev` honors `$XDG_CONFIG_HOME`, `$XDG_DATA_HOME`, and per-CLI
`ETHOSDEV_CONFIG_DIR` / `ETHOSDEV_DATA_DIR` overrides. Defaults:

```
$XDG_CONFIG_HOME/ethosdev/dev.env       (default ~/.config/ethosdev/)
$XDG_DATA_HOME/ethosdev/wallets.json    (default ~/.local/share/ethosdev/, 0600)
```

Wallets land under `~/.local/share/`, not `~/.config/`, to signal "do not
sync to dotfiles repos."

Source for the ethosdev side of the contract:
[trust-ethos/ethos · standalone/cli/src/utils/paths.ts](https://github.com/trust-ethos/ethos/blob/main/standalone/cli/src/utils/paths.ts)
(after CORE-3662 / CORE-3665 land).
