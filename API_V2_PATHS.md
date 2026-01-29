# API v2 Paths - Reference

This document outlines the API v2 endpoints used by the Ethos CLI.

## Base URLs

- **Production**: `https://api.ethos.network`
- **Development**: `https://api.dev.ethos.network`

## User Endpoints

### Get User by Twitter/X Username

```
GET /api/v2/user/by/x/{accountIdOrUsername}
```

**Parameters:**
- `accountIdOrUsername` (path) - Twitter/X username OR Twitter ID

**CLI Usage:**
```bash
ethos user info 0xNoWater
```

### Get User by Ethereum Address

```
GET /api/v2/user/by/address/{address}
```

**Parameters:**
- `address` (path) - Ethereum address (42 chars including 0x)

**CLI Usage:**
```bash
ethos user info 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### Get User by Profile ID

```
GET /api/v2/user/by/profile-id/{profileId}
```

**Parameters:**
- `profileId` (path) - Numeric Ethos profile ID

**CLI Usage:**
```bash
ethos user info profileId:21
```

### Search Users

```
GET /api/v2/users/search
```

**Query Parameters:**
- `query` (string) - Search query
- `limit` (number) - Maximum results (default: 10)

**CLI Usage:**
```bash
ethos user search vitalik --limit 5
```

## XP Endpoints

### Get XP Seasons

```
GET /api/v2/xp/seasons
```

**Response:**
```json
{
  "seasons": [...],
  "currentSeason": { "id": 2, "name": "Season 2", "week": 1 }
}
```

**CLI Usage:**
```bash
ethos xp seasons
```

### Get Leaderboard Rank

```
GET /api/v2/xp/user/{userkey}/leaderboard-rank
```

**Parameters:**
- `userkey` (path) - Valid userkey format (e.g., `profileId:21`, `address:0x...`)

**CLI Usage:**
```bash
ethos xp rank 0xNoWater
```

Note: The CLI auto-resolves identifiers to userkeys by first fetching user info.

## Smart Identifier Detection

The CLI automatically routes requests based on identifier format:

| Input Format | Detection Method | API Endpoint |
|--------------|------------------|--------------|
| `0xNoWater` | Default (plain text) | `/user/by/x/0xNoWater` |
| `0xd8dA...` (40 hex) | Regex: `^0x[a-fA-F0-9]{40}$` | `/user/by/address/0xd8dA...` |
| `vitalik.eth` | Ends with `.eth` | Search, then best match |
| `address:0x...` | Explicit prefix | `/user/by/address/0x...` |
| `twitter:name` | Explicit prefix | `/user/by/x/name` |
| `profileId:21` | Explicit prefix | `/user/by/profile-id/21` |

## Response Structure

### User Object

```json
{
  "id": 13467,
  "profileId": 21,
  "displayName": "0xNoWater.eth",
  "username": "0xNoWater",
  "avatarUrl": "https://...",
  "score": 1501,
  "status": "ACTIVE",
  "userkeys": ["profileId:21", "address:0x...", "service:x.com:..."],
  "xpTotal": 76125,
  "xpStreakDays": 1,
  "stats": {
    "review": { "received": { "positive": 2, "neutral": 6, "negative": 0 } },
    "vouch": { "given": { "count": 1 }, "received": { "count": 3 } }
  },
  "links": {
    "profile": "https://app.ethos.network/profile/x/0xNoWater"
  }
}
```

## Error Handling

All errors return:
```json
{
  "message": "Error message",
  "code": "ERROR_CODE",
  "data": { "httpStatus": 400, "path": "...", "reqId": "..." }
}
```

The CLI formats errors with actionable suggestions:
```
⚠ User not found: videvian

💡 Try: ethos user search "videvian"
```
