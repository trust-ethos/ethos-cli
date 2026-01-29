# API v2 Paths - Reference

This document outlines the correct API v2 endpoints used by the Ethos CLI.

## Base URLs

- **Production**: `https://api.ethos.network`
- **Development**: `https://api.dev.ethos.network`

## User Endpoints

### Get User by Twitter/X Username

```
GET /api/v2/user/by/x/{accountIdOrUsername}
```

**Parameters:**
- `accountIdOrUsername` (path) - Twitter/X username OR Twitter ID (e.g., "0xNoWater" or "1826469318311165952")

**Response:**
```json
{
  "id": 3,
  "profileId": 11,
  "username": "0xNoWater",
  "displayName": "0xNoWater.eth",
  "avatarUrl": "https://...",
  "score": 1785,
  "status": "ACTIVE",
  "userkeys": ["profileId:11", "address:0x..."],
  "xpTotal": 677040,
  ...
}
```

**CLI Usage:**
```bash
ethos user info 0xNoWater
```

### Get User by Ethereum Address

```
GET /api/v2/user/by/address/{address}
```

**Parameters:**
- `address` (path) - Ethereum address (e.g., "0xA6a665b705f7Bf2eCa315047f6ffbb557b2106ca")

**Response:**
```json
{
  "id": 3,
  "profileId": 11,
  "username": "0xNoWater",
  "address": "0xA6a665b705f7Bf2eCa315047f6ffbb557b2106ca",
  "score": 1785,
  ...
}
```

**CLI Usage:**
```bash
ethos user info 0xA6a665b705f7Bf2eCa315047f6ffbb557b2106ca
# or
ethos user info address:0xA6a665b705f7Bf2eCa315047f6ffbb557b2106ca
```

### Search Users

```
GET /api/v2/users/search
```

**Query Parameters:**
- `query` (string) - Search query
- `limit` (number) - Maximum results (default: 10)
- `offset` (number, optional) - Pagination offset

**Response:**
```json
{
  "values": [
    {
      "id": 123,
      "username": "...",
      "address": "0x...",
      "score": 1850
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**CLI Usage:**
```bash
ethos user search "crypto developer"
ethos user search "vitalik" --limit 5
```

## XP Endpoints

### Get XP Balance

```
GET /api/v2/xp/user/{userkey}
```

**Parameters:**
- `userkey` (path) - Username, address, or userkey identifier (e.g., "address:0x...")

**Response:**
```
677040
```
Returns the total XP as a number.

**CLI Usage:**
```bash
ethos xp balance address:0xA6a665b705f7Bf2eCa315047f6ffbb557b2106ca
# Output:
# XP Balance
# Total XP: 677,040
```

### Get XP Seasons

```
GET /api/v2/xp/seasons
```

**Response:**
```json
{
  "seasons": [
    {
      "id": 2,
      "name": "Season 2",
      "startDate": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": 1,
      "name": "Season 1",
      "startDate": "2025-05-14T00:00:00.000Z"
    },
    {
      "id": 0,
      "name": "Season 0",
      "startDate": "2025-01-01T00:00:00.000Z"
    }
  ],
  "currentSeason": {
    "id": 2,
    "name": "Season 2",
    "startDate": "2026-01-01T00:00:00.000Z",
    "week": 1
  }
}
```

**CLI Usage:**
```bash
ethos xp seasons
ethos xp seasons --json
```

### Get Leaderboard Rank

```
GET /api/v2/xp/user/{userkey}/leaderboard-rank
```

**Parameters:**
- `userkey` (path) - Username, address, or userkey identifier (e.g., "address:0x...")

**Response:**
```
4
```
Returns the leaderboard rank as a number.

**CLI Usage:**
```bash
ethos xp rank address:0xA6a665b705f7Bf2eCa315047f6ffbb557b2106ca
# Output:
# Leaderboard Rank
# Rank: #4
```

## Response Patterns

### v2 API Response Structure

The v2 API typically returns objects with nested data:

1. **Collections** (search, seasons):
   ```json
   {
     "values": [...],    // or "seasons": [...]
     "total": 10,
     "limit": 10,
     "offset": 0
   }
   ```

2. **Single Resources** (user, xp):
   ```json
   {
     "field1": "value",
     "field2": "value"
   }
   ```

### Error Responses

All errors return:
```json
{
  "message": "Error message",
  "code": "ERROR_CODE",
  "data": {
    "code": "ERROR_CODE",
    "httpStatus": 400,
    "path": "endpoint.path",
    "reqId": "request-id"
  },
  "issues": [...]  // Optional validation errors
}
```

## Implementation Notes

### CLI Command → API Mapping

The CLI automatically routes requests based on the identifier format:

| Identifier Format | API Endpoint |
|------------------|--------------|
| `0xNoWater` (username) | `GET /api/v2/users/by/x/0xNoWater` |
| `0xd8dA...` (Ethereum address) | `GET /api/v2/users/by/address/0xd8dA...` |
| `address:0xd8dA...` (explicit) | `GET /api/v2/users/by/address/0xd8dA...` |

### Response Unwrapping

The CLI unwraps nested responses for human-readable output:

```typescript
// API returns: { seasons: [...] }
// CLI displays: formatted list of seasons

// API returns: { values: [...] }
// CLI displays: formatted search results
```

### Debug Mode

Use `ETHOS_DEBUG=true` to see the exact API calls:

```bash
ETHOS_ENV=dev ETHOS_DEBUG=true ethos user info 0xNoWater
```

Output:
```
[DEBUG] Fetching https://api.dev.ethos.network/api/v2/users/by/x/0xNoWater
[DEBUG] Response status: 404
⚠ User not found: 0xNoWater
```

## Migration from v1 to v2

| v1 Endpoint | v2 Endpoint |
|-------------|-------------|
| `/api/v1/user/username/{username}` | `/api/v2/users/by/x/{username}` |
| `/api/v1/user/address/{address}` | `/api/v2/users/by/address/{address}` |
| `/api/v1/user/search` | `/api/v2/users/search` |
| `/api/v1/xp/total/{userkey}` | `/api/v2/xp/total/{userkey}` |
| `/api/v1/xp/seasons` | `/api/v2/xp/seasons` |
| `/api/v1/xp/rank/{userkey}` | `/api/v2/xp/rank/{userkey}` |

## External Documentation

- **Swagger Docs**: https://api.dev.ethos.network/docs
- **Production API**: https://api.ethos.network

## Testing

All endpoints can be tested with curl:

```bash
# Get user by Twitter username
curl https://api.dev.ethos.network/api/v2/users/by/x/0xNoWater

# Get XP seasons
curl https://api.dev.ethos.network/api/v2/xp/seasons

# Search users
curl "https://api.dev.ethos.network/api/v2/users/search?query=test&limit=10"
```
