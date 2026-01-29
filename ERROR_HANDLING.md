# Error Handling Conventions

## Overview

The Ethos CLI implements user-friendly error handling with:
- **Clear, actionable error messages** (no stack traces by default)
- **Helpful suggestions** for resolving common issues
- **Debug/verbose mode** for troubleshooting
- **Semantic exit codes** for programmatic usage

## Error Types

### 1. Network Errors
Shown when the CLI cannot connect to the API.

**Example:**
```
✖ Network Error
  Cannot connect to API at https://echo.ethos.network

Suggestions:
  • Check your internet connection
  • Verify the API is accessible
  • Try again in a few moments

Run with --verbose for more details
```

**Common Causes:**
- API is down or unreachable
- Network connectivity issues
- Incorrect API URL in environment variables

### 2. Not Found Errors
Shown when a resource (user, XP data, etc.) doesn't exist.

**Example:**
```
⚠ User not found: invaliduser123

Suggestions:
  • Verify the identifier is correct
  • Try searching for the user first
```

**Common Causes:**
- Typo in username or address
- User doesn't exist in the system
- Using wrong identifier format

### 3. Validation Errors
Shown when input is invalid.

**Example:**
```
⚠ Validation Error
  Invalid Ethereum address format

Suggestions:
  • Check your input and try again
```

**Common Causes:**
- Malformed Ethereum address
- Invalid userkey format
- Missing required arguments

### 4. API Errors
Shown when the API returns an error response.

**Example:**
```
✖ API Error
  Rate limit exceeded
  Status: 429

Suggestions:
  • The API returned an error
  • Try again or contact support if the issue persists
```

**Common Causes:**
- Rate limiting
- Server errors (500)
- Invalid API requests

## Debug Modes

### 1. Verbose Mode (`--verbose` or `-v`)

Shows detailed error information including:
- Full API URLs
- HTTP status codes
- Response bodies
- Stack traces

**Usage:**
```bash
ethos user info invaliduser --verbose
```

**Output:**
```
✖ Network Error
  Cannot connect to API at https://echo.ethos.network

Suggestions:
  • Check your internet connection
  • Verify the API is accessible
  • Try again in a few moments

Debug Information:
  URL: https://echo.ethos.network/api/v1/user/username/invaliduser
  Stack Trace:
    at EchoClient.request (...)
    at async UserInfo.run (...)
```

### 2. Debug Logs (`ETHOS_DEBUG=true`)

Enables debug logging to stderr for all API requests and responses.

**Usage:**
```bash
ETHOS_DEBUG=true ethos user info vitalik.eth
```

**Output:**
```
[DEBUG] Fetching https://echo.ethos.network/api/v1/user/username/vitalik.eth
[DEBUG] Response status: 200
[DEBUG] Response data { ... }
```

**Alternative:**
```bash
export DEBUG=ethos:*
ethos user info vitalik.eth
```

## Environment Variables

### `ETHOS_DEBUG`
Enable debug logging for all API requests.

```bash
export ETHOS_DEBUG=true
ethos user info vitalik.eth
```

### `ETHOS_ENV`
Set the API environment.

```bash
export ETHOS_ENV=staging  # Use staging API
export ETHOS_ENV=dev      # Use local dev API (localhost:4000)
export ETHOS_ENV=prod     # Use production API (default)
```

### `ETHOS_API_URL`
Override the API URL completely.

```bash
export ETHOS_API_URL=http://localhost:4000
ethos user info testuser
```

## Exit Codes

- **0** - Success
- **1** - Runtime error (API failure, not found, network error)
- **2** - Invalid usage (missing arguments, validation error)

**Example (checking exit codes):**
```bash
# Success
ethos user info vitalik.eth
echo $?  # 0

# Not found
ethos user info invaliduser123
echo $?  # 1

# Invalid usage
ethos user info
echo $?  # 2
```

## Error Handling Best Practices

### For Human Users

1. **Read the error message** - It describes what went wrong
2. **Check the suggestions** - They provide actionable fixes
3. **Use --verbose** - If you need more details for troubleshooting
4. **Check environment variables** - Ensure ETHOS_ENV is set correctly

### For Scripts/Automation

1. **Check exit codes** - Use `$?` to detect failures
2. **Use --json flag** - For consistent, parseable output
3. **Enable ETHOS_DEBUG** - When debugging issues
4. **Handle specific errors** - Check exit code and error messages

**Example Script:**
```bash
#!/bin/bash

# Attempt to get user info
if ethos user info "$1" --json > user.json 2>/dev/null; then
  echo "User found"
  cat user.json
else
  exit_code=$?
  if [ $exit_code -eq 1 ]; then
    echo "Error: User not found or API error"
  elif [ $exit_code -eq 2 ]; then
    echo "Error: Invalid usage"
  fi
  exit $exit_code
fi
```

## Testing Error Scenarios

### Test Network Error
```bash
# Use invalid API URL
ETHOS_API_URL=http://invalid-host ethos user info test
```

### Test Not Found Error
```bash
# Use non-existent user (requires working API)
ethos user info user-that-definitely-does-not-exist-12345
```

### Test Validation Error
```bash
# Missing required argument
ethos user info
```

### Test Debug Mode
```bash
# Enable debug logging
ETHOS_DEBUG=true ethos user info test

# Use verbose flag
ethos user info test --verbose
```

## Common Troubleshooting Steps

### 1. "Cannot connect to API"

**Check:**
- Is the API actually running?
- Is ETHOS_ENV set correctly?
- Try with ETHOS_DEBUG=true to see the URL being called

**Solution:**
```bash
# For local development
export ETHOS_ENV=dev
export ETHOS_API_URL=http://localhost:4000

# Verify it works
ethos xp seasons --verbose
```

### 2. "User not found"

**Check:**
- Is the username spelled correctly?
- Does the user exist in the system?
- Try searching first

**Solution:**
```bash
# Search for the user first
ethos user search "partial name"

# Then use exact username
ethos user info exact-username
```

### 3. "API Error"

**Check:**
- What is the status code? (use --verbose)
- Is there a specific error message in the response?
- Check API logs if you have access

**Solution:**
```bash
# Get full error details
ethos user info test --verbose

# Check with debug mode
ETHOS_DEBUG=true ethos user info test
```

## Adding New Error Types

When adding new commands or error scenarios:

1. **Use custom error classes** from `src/lib/errors/cli-error.ts`
2. **Provide helpful suggestions** in the error constructor
3. **Test error messages** for clarity
4. **Update this documentation** with examples

**Example:**
```typescript
import { ValidationError } from '../../lib/errors/cli-error.js';

// Throw a validation error
if (!isValidInput(input)) {
  throw new ValidationError('Invalid input format', 'inputField');
}
```
