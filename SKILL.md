---
name: ethos-cli
description: |
  Query Ethos Network reputation data via CLI. Use when users ask about:
  - Looking up user profiles, scores, or reputation (ethos user info/summary)
  - Checking vouches, reviews, or slashes between users
  - Querying XP balances, leaderboard ranks, or seasons
  - Exploring trust markets, listings, or broker posts
  - Finding validator NFTs or auctions
  Triggers: "ethos reputation", "check score", "who vouched for", "trust market", "ethos profile", "review on ethos"
---

# Ethos CLI

Read-only CLI for querying Ethos Network reputation data.

## Installation

```bash
npm install -g @trust-ethos/cli
```

## User Identification

All commands accept flexible identifiers:

| Format | Example |
|--------|---------|
| Twitter username | `sethgho`, `0xNowater` |
| ETH address | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` |
| ENS name | `vitalik.eth` |

## Commands

### User
```bash
ethos user info <user>           # Profile with score level
ethos user summary <user>        # Profile + activity + vouches
ethos user activity <user>       # Recent reviews/vouches
ethos user search <query>        # Find users
ethos user invitations <user>    # Invitations sent
```

### Vouches
```bash
ethos vouch list <user>          # Vouches received
ethos vouch list --author <user> # Vouches given
ethos vouch info <id>            # Vouch details
ethos vouch mutual <u1> <u2>     # Mutual vouchers
ethos vouch votes <id>           # Votes on vouch
```

### Reviews
```bash
ethos review list <user>         # Reviews for user
ethos review info <id>           # Review details
ethos review votes <id>          # Votes on review
```

### Slashes
```bash
ethos slash list                 # All slashes
ethos slash info <id>            # Slash details
ethos slash votes <id>           # Votes on slash
```

### XP
```bash
ethos xp rank <user>             # Leaderboard position
ethos xp rank <user> --season 2  # Specific season
ethos xp seasons                 # List seasons
```

### Trust Markets
```bash
ethos market list                # All markets
ethos market info <user>         # User's market
ethos market holders <user>      # Trust/distrust holders
ethos market featured            # Top gainers/losers
```

### Projects/Listings
```bash
ethos listing list               # Active listings
ethos listing info <id>          # Project details
ethos listing voters <id>        # Bullish/bearish voters
```

### Broker Posts
```bash
ethos broker list                # All posts
ethos broker list --type hire    # Filter: sell|buy|hire|for-hire|bounty
ethos broker info <id>           # Post details
```

### Validators & Auctions
```bash
ethos validator list             # All validators
ethos validator info <tokenId>   # Validator details
ethos validator sales            # For sale on OpenSea
ethos auction list               # All auctions
ethos auction active             # Current auction
ethos auction info <id>          # Auction details
```

### Configuration
```bash
ethos config get                 # Show config
ethos config set apiUrl=<url>    # Set API
ethos config path                # Config location
```

## Global Flags

All commands support:
- `--json` / `-j` — JSON output
- `--verbose` / `-v` — Detailed errors
- `--limit` / `-l` — Results limit (default: 10)
- `--offset` / `-o` — Pagination offset

## Score Levels

| Range | Level |
|-------|-------|
| < 800 | UNTRUSTED |
| 800-1199 | QUESTIONABLE |
| 1200-1599 | NEUTRAL |
| 1600-1999 | REPUTABLE |
| 2000+ | EXEMPLARY |

## Common Patterns

```bash
# Quick lookup
ethos user info vitalik.eth

# Full picture
ethos user summary sethgho

# Mutual connections
ethos vouch mutual sethgho 0xNowater

# Script with jq
ethos user info sethgho --json | jq '.score'
ethos vouch list sethgho --json | jq '.values[].balance'
```

## Exit Codes

- `0` — Success
- `1` — Runtime error
- `2` — Invalid usage
