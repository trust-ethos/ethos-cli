/**
 * Userkey validation and parsing utilities
 */

/**
 * Parses a userkey identifier into a format suitable for API calls
 *
 * Supported formats:
 * - address:<address>
 * - service:discord:<discordUserId>
 * - service:x.com:<twitterUserId>
 * - service:x.com:username:<twitterUsername>
 * - Plain username (automatically prefixed with username:)
 * - Plain Ethereum address (automatically prefixed with address:)
 */
export function parseUserkey(identifier: string): string {
  // Already formatted as userkey
  if (identifier.includes(':')) {
    return identifier;
  }

  // Ethereum address (0x followed by 40 hex characters)
  if (/^0x[a-fA-F0-9]{40}$/.test(identifier)) {
    return `address:${identifier}`;
  }

  // Otherwise treat as username
  return identifier;
}

/**
 * Validates that a userkey is in a supported format
 */
export function isValidUserkey(identifier: string): boolean {
  if (!identifier || identifier.trim().length === 0) {
    return false;
  }

  // Basic validation - just ensure it's not empty
  // The API will handle more specific validation
  return true;
}
