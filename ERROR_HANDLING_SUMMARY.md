# Error Handling Improvements Summary

## Problem

The original error output was ugly and unhelpful:
```
Error: Failed to fetch /api/v1/user/username/0xnowater: fetch failed
    at Object.error (/Users/.../node_modules/@oclif/core/lib/errors/error.js:44:15)
    at UserInfo.error (/Users/.../node_modules/@oclif/core/lib/command.js:216:23)
    [... full stack trace ...]
```

## Solution

Implemented comprehensive error handling with:

### 1. Custom Error Classes

Created `src/lib/errors/cli-error.ts` with:
- `CLIError` - Base error class with suggestions
- `NetworkError` - Connection/API unreachable errors
- `NotFoundError` - Resource not found (404)
- `ValidationError` - Invalid input
- `APIError` - API returned error response

### 2. User-Friendly Error Formatting

Created `src/lib/formatting/error.ts` with:
- Colored icons (⚠ for warnings, ✖ for errors)
- Clear error messages
- Actionable suggestions
- Optional verbose mode

**Example Output:**
```
⚠ User not found: 0xnowater

Suggestions:
  • Verify the identifier is correct
  • Try searching for the user first

Run with --verbose for more details
```

### 3. Debug/Verbose Modes

#### Verbose Mode (`--verbose` or `-v`)
Shows detailed debugging information:
```bash
ethos user info 0xnowater --verbose
```

Output includes:
- Full stack traces
- API URLs
- Response bodies
- Status codes

#### Debug Logs (`ETHOS_DEBUG=true`)
Logs all API interactions to stderr:
```bash
ETHOS_DEBUG=true ethos user info test
```

Output:
```
[DEBUG] Fetching https://api.dev.ethos.network/api/v1/user/username/test
[DEBUG] Response status: 404
```

### 4. Updated API Client

Enhanced `src/lib/api/echo-client.ts`:
- Categorizes errors (network, not found, API)
- Parses error responses for meaningful messages
- Supports debug logging
- Correct API URLs (api.dev.ethos.network, api.ethos.network)

### 5. Updated All Commands

All commands now:
- Support `--verbose` flag
- Use custom error formatting
- Exit cleanly with proper codes
- Don't show stack traces by default

## Files Changed

### New Files
- `src/lib/errors/cli-error.ts` - Custom error classes
- `src/lib/formatting/error.ts` - Error formatting utilities
- `ERROR_HANDLING.md` - Comprehensive error handling documentation

### Modified Files
- `src/lib/api/echo-client.ts` - Enhanced error handling and debug logging
- `src/commands/user/info.ts` - Added --verbose flag and error formatting
- `src/commands/user/search.ts` - Added --verbose flag and error formatting
- `src/commands/xp/balance.ts` - Added --verbose flag and error formatting
- `src/commands/xp/rank.ts` - Added --verbose flag and error formatting
- `src/commands/xp/seasons.ts` - Added --verbose flag and error formatting
- `.env.sample` - Updated with correct API URLs and debug options

## Testing

### Test User Not Found
```bash
ETHOS_ENV=dev ./bin/dev.js user info 0xnowater
```

**Output:**
```
⚠ User not found: 0xnowater

Suggestions:
  • Verify the identifier is correct
  • Try searching for the user first

Run with --verbose for more details
```

### Test with Verbose Mode
```bash
ETHOS_ENV=dev ./bin/dev.js user info 0xnowater --verbose
```

**Output includes:**
- Error message and suggestions
- Stack trace
- Debug information

### Test with Debug Logging
```bash
ETHOS_ENV=dev ETHOS_DEBUG=true ./bin/dev.js user info 0xnowater
```

**Output includes:**
- [DEBUG] logs showing API calls
- Error message and suggestions

## Conventions Established

### 1. Error Messages
- Short, clear description
- No jargon or technical details (unless --verbose)
- Actionable suggestions

### 2. Exit Codes
- `0` - Success
- `1` - Runtime error (API, network, not found)
- `2` - Invalid usage (validation, missing args)

### 3. Debug Modes
- `--verbose` flag on all commands
- `ETHOS_DEBUG=true` environment variable
- Debug logs go to stderr (don't interfere with JSON output)

### 4. Environment Variables
- `ETHOS_ENV` - Environment (prod, dev)
- `ETHOS_API_URL` - Custom API URL
- `ETHOS_DEBUG` - Enable debug logging
- `DEBUG=ethos:*` - Alternative debug flag

### 5. API URLs
- Production: `https://api.ethos.network`
- Development: `https://api.dev.ethos.network`
- Local: `http://localhost:4000` (via ETHOS_API_URL)

## Documentation

Created comprehensive documentation in `ERROR_HANDLING.md`:
- Error types with examples
- Debug modes usage
- Environment variables
- Exit codes
- Troubleshooting guide
- Best practices for scripts

## Benefits

1. **Better UX** - Clear, helpful error messages
2. **Easier Debugging** - Verbose and debug modes
3. **Script-Friendly** - Semantic exit codes
4. **Maintainable** - Consistent error handling pattern
5. **Documented** - Comprehensive guides for users and developers

## Next Steps

Error handling is production-ready. Future enhancements could include:
- Structured logging (JSON logs)
- Error telemetry/reporting
- Retry logic for transient errors
- Offline mode with caching
