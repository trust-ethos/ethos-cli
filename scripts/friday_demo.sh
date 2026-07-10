#!/usr/bin/env bash
# friday_demo — a narrated, end-to-end tour of the new Ethos CLI capabilities:
# named accounts, server-signed reviews & vouches (Ethos Everywhere Wallet),
# reputation-market trading, and the MCP server.
#
# Usage:
#   scripts/friday_demo.sh                 # full show (pauses between acts on a TTY)
#   NONSTOP=1 scripts/friday_demo.sh       # no pauses
#   MARKET_ID=2 OPEN_CREDITS=5 CLOSE_TOKENS=1 scripts/friday_demo.sh
#   REVIEW_TARGET=jack VOUCH_TARGET=profileId:328 scripts/friday_demo.sh
#
# The script is safe to re-run: duplicate-review / already-vouched errors are
# narrated and skipped rather than aborting the show.

set -u

# ── Where's the CLI? ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -x "$SCRIPT_DIR/../bin/run.js" ]; then
  ETHOS="$SCRIPT_DIR/../bin/run.js"
elif command -v ethos >/dev/null 2>&1; then
  ETHOS="$(command -v ethos)"
else
  echo "Could not find the ethos CLI (bin/run.js or \`ethos\` on PATH)." >&2
  exit 1
fi

# Knobs
MARKET_ID="${MARKET_ID:-2}"
OPEN_CREDITS="${OPEN_CREDITS:-5}"
CLOSE_TOKENS="${CLOSE_TOKENS:-1}"
REVIEW_TARGET="${REVIEW_TARGET:-jack}"
VOUCH_TARGET="${VOUCH_TARGET:-profileId:328}"
ALT_ACCOUNT="${ALT_ACCOUNT:-akebot}"
# The server allows 3 on-chain submissions per wallet per 60s; pacing writes
# ~20s apart keeps every run under it. Set WRITE_GAP=0 if you talk slowly.
WRITE_GAP="${WRITE_GAP:-20}"
RUN_TAG="$(date +%H:%M:%S)"

# ── Palette ─────────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; ITAL=$'\033[3m'; RESET=$'\033[0m'
  CYAN=$'\033[36m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; MAGENTA=$'\033[35m'
  BLUE=$'\033[34m'; RED=$'\033[31m'
else
  BOLD=""; DIM=""; ITAL=""; RESET=""; CYAN=""; GREEN=""; YELLOW=""; MAGENTA=""; BLUE=""; RED=""
fi

RULE="────────────────────────────────────────────────────────────────────"
ACT_NO=0
START_TS=$(date +%s)
TX_HASHES=""

banner() {
  printf '\n%s\n' "${MAGENTA}${BOLD}╔══════════════════════════════════════════════════════════════════╗${RESET}"
  printf '%s\n'   "${MAGENTA}${BOLD}║              🎩  ETHOS CLI — THE FRIDAY DEMO  🎩                   ║${RESET}"
  printf '%s\n'   "${MAGENTA}${BOLD}║      auth → identity → reviews → vouches → trades → agents        ║${RESET}"
  printf '%s\n\n' "${MAGENTA}${BOLD}╚══════════════════════════════════════════════════════════════════╝${RESET}"
}

act() {
  ACT_NO=$((ACT_NO + 1))
  printf '\n%s\n' "${BLUE}${RULE}${RESET}"
  printf '%s\n'   "${BLUE}${BOLD}  🎬 ACT ${ACT_NO} — $1${RESET}"
  printf '%s\n'   "${BLUE}${RULE}${RESET}"
}

say() { printf '%s\n' "${DIM}${ITAL}  $1${RESET}"; }

pause() {
  if [ -t 0 ] && [ -z "${NONSTOP:-}" ]; then
    printf '%s' "${DIM}  ⏎ press Enter for the next act…${RESET}"
    read -r _
  else
    sleep 1
  fi
}

# Show the command, run it, indent its (colored) output, remember tx hashes.
run() {
  local shown="" arg
  for arg in "$@"; do
    case "$arg" in
      *" "*) shown="$shown \"$arg\"";;
      *) shown="$shown $arg";;
    esac
  done
  printf '\n  %s\n' "${CYAN}${BOLD}❯ ethos${shown}${RESET}"
  local out rc
  out=$(FORCE_COLOR=1 "$ETHOS" "$@" 2>&1); rc=$?
  [ -n "$out" ] && printf '%s\n' "$out" | sed 's/^/    /'
  local hashes
  hashes=$(printf '%s' "$out" | grep -oE '0x[0-9a-fA-F]{64}' | sort -u)
  [ -n "$hashes" ] && TX_HASHES="${TX_HASHES}${hashes}"$'\n'
  return $rc
}

# Like run, but re-run-friendly: narrate a failure and carry on with the show.
run_soft() {
  if ! run "$@"; then
    printf '  %s\n' "${YELLOW}⚠  that one didn’t land (usually a duplicate from a previous run, or the rate limiter catching its breath) — the show goes on.${RESET}"
  fi
}

# On-chain writes are rate-limited server-side (3 per wallet per minute), so
# space them out. In a live demo the narration usually covers this anyway.
LAST_WRITE_TS=0
throttle_writes() {
  local now wait
  now=$(date +%s)
  wait=$((WRITE_GAP - (now - LAST_WRITE_TS)))
  if [ "$LAST_WRITE_TS" -gt 0 ] && [ "$wait" -gt 0 ]; then
    printf '  %s' "${DIM}…giving the rate limiter a moment (${wait}s)${RESET}"
    sleep "$wait"
    printf '\r%*s\r' 60 ''
  fi
}

# A rate-limited, failure-tolerant on-chain write.
run_write() {
  throttle_writes
  run_soft "$@"
  LAST_WRITE_TS=$(date +%s)
}

ok()   { printf '  %s\n' "${GREEN}✔ $1${RESET}"; }
fail() { printf '  %s\n' "${RED}✘ $1${RESET}"; }

# ── Overture: preflight ─────────────────────────────────────────────────────
banner
say "Every transaction you’re about to see is a real on-chain transaction,"
say "signed server-side by an Ethos Everywhere Wallet. There is not a single"
say "private key on this laptop. The only credential here is an API key."

act "PREFLIGHT — is anybody home?"
say "One authenticated round-trip proves the whole chain is alive:"
say "CLI → API key → echo → profile."
if ! run whoami; then
  fail "The stack isn’t answering. Start it first:  pnpm start:resources && pnpm start"
  exit 1
fi
ok "Authenticated. The stage is set."
pause

# Remember the active account so the curtain call can restore it.
ORIGINAL_ACCOUNT=$("$ETHOS" account current --json 2>/dev/null | grep -oE '"name":[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"name":[[:space:]]*"//;s/"$//')
restore_account() {
  if [ -n "${ORIGINAL_ACCOUNT:-}" ]; then
    "$ETHOS" switch "$ORIGINAL_ACCOUNT" >/dev/null 2>&1 || true
  fi
}
trap restore_account EXIT

# ── Act: accounts ───────────────────────────────────────────────────────────
act "FIRST-CLASS ACCOUNTS — one CLI, many hats"
say "Accounts are just named API keys — no wallet addresses stored anywhere."
say "The server figures out whose wallet to use from the key itself."
run account list
say "Switching identities is one word:"
run switch "$ALT_ACCOUNT"
run whoami
say "…and back:"
run switch "${ORIGINAL_ACCOUNT:-0xnowater}"
ok "Two identities, zero addresses typed."
pause

# ── Act: reviews ────────────────────────────────────────────────────────────
act "REVIEWS — sign nothing, publish anyway"
say "A review of an X account — one that may never have joined Ethos."
say "The EEW signs it server-side; the CLI just asks politely."
run_write review add "$REVIEW_TARGET" --score positive --title "Friday demo says hi (${RUN_TAG})" --comment "Posted live from the ethos CLI, keys nowhere in sight." --yes
ok "Review flow exercised (identifier styles: handle, 0x…, profileId:…, name.eth)."
pause

# ── Act: vouches ────────────────────────────────────────────────────────────
act "VOUCHES — put credits where your mouth is"
say "Vouching stakes real credits on someone’s reputation — and unstaking"
say "gets them back. Full custody lifecycle, all signed server-side."
say "First, release any stake left over from the last time we ran this:"
run_write vouch remove "$VOUCH_TARGET" --yes
say "…and now stake fresh credits:"
run_write vouch create "$VOUCH_TARGET" --amount 1 --yes
ok "Stake → release → restake: the whole vouch lifecycle, no keys involved."
pause

# ── Act: trading ────────────────────────────────────────────────────────────
act "REPUTATION MARKETS — the show-stopper"
say "Live v2 markets, quoted and traded straight from the terminal."
run trade list
say "First a quote — tokens out, price impact, slippage floor:"
run trade quote "$MARKET_ID" --side long --amount "$OPEN_CREDITS"
say "Now the real thing. Slippage-guarded, server-signed, on-chain:"
run_write trade open "$MARKET_ID" --side long --amount "$OPEN_CREDITS" --yes
run trade position "$MARKET_ID"
say "And close part of it — realizing whatever the market gives us:"
run_write trade close "$MARKET_ID" --side long --tokens "$CLOSE_TOKENS" --yes
ok "Open → position → close, end to end."
pause

# ── Act: identity switch, replayed on the market ────────────────────────────
act "THE IDENTITY TRICK — same command, different books"
say "Watch the same ‘trade position’ answer differently as we change hats."
say "No addresses involved — the server resolves each account’s own wallet."
run trade position "$MARKET_ID"
run switch "$ALT_ACCOUNT"
run trade position "$MARKET_ID"
run switch "${ORIGINAL_ACCOUNT:-0xnowater}"
ok "Per-account wallet resolution, live."
pause

# ── Act: MCP finale ─────────────────────────────────────────────────────────
act "FINALE — the CLI becomes an agent’s hands"
say "‘ethos mcp’ turns everything you just watched into typed tools for any"
say "MCP client. Read-only by default; writes and trading are opt-in flags,"
say "with a per-call spend cap. Ask Claude for an undervalued market and it"
say "can quote and open the position itself — still no keys on the machine."
printf '\n  %s\n' "${CYAN}${BOLD}❯ ethos mcp --allow-trading --max-spend 25   ${RESET}${DIM}(tools/list over stdio)${RESET}"
MCP_TOOLS=$(printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"friday-demo","version":"1.0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | "$ETHOS" mcp --allow-trading --max-spend 25 2>/dev/null \
  | tail -1 \
  | grep -oE '"name":"[a-z_]+"' | sed 's/"name":"//;s/"//')
if [ -n "$MCP_TOOLS" ]; then
  printf '%s\n' "$MCP_TOOLS" | sed "s/^/    ${GREEN}⚙ ${RESET}/"
  ok "$(printf '%s' "$MCP_TOOLS" | grep -c .) typed tools, tier-gated server-side."
else
  fail "MCP smoke test returned nothing — check ‘ethos mcp’ by hand."
fi

# ── Curtain call ────────────────────────────────────────────────────────────
ELAPSED=$(( $(date +%s) - START_TS ))
printf '\n%s\n' "${MAGENTA}${RULE}${RESET}"
printf '%s\n'   "${MAGENTA}${BOLD}  🏁 CURTAIN CALL${RESET}"
printf '%s\n'   "${MAGENTA}${RULE}${RESET}"
say "Accounts switched, reviews posted, credits staked, positions traded,"
say "and an MCP server offered it all to the machines — in ${ELAPSED}s."
UNIQUE_TX=$(printf '%s' "$TX_HASHES" | grep -c . || true)
if [ "${UNIQUE_TX:-0}" -gt 0 ]; then
  printf '\n  %s\n' "${BOLD}On-chain receipts:${RESET}"
  printf '%s' "$TX_HASHES" | sort -u | sed "s/^/    ${GREEN}⛓ ${RESET}/"
fi
printf '\n  %s\n\n' "${DIM}Not one private key was harmed (or present) in the making of this demo.${RESET}"
