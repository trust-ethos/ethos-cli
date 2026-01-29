export type IdentifierType = 
  | 'address'
  | 'ens'
  | 'twitter'
  | 'discord'
  | 'telegram'
  | 'farcaster'
  | 'profileId'
  | 'unknown';

export interface ParsedIdentifier {
  type: IdentifierType;
  value: string;
  original: string;
}

const EXPLICIT_PREFIX_MAP: Record<string, IdentifierType> = {
  'address': 'address',
  'twitter': 'twitter',
  'x': 'twitter',
  'discord': 'discord',
  'telegram': 'telegram',
  'farcaster': 'farcaster',
  'profileid': 'profileId',
  'profile': 'profileId',
  'service': 'unknown',
};

const SERVICE_TYPE_MAP: Record<string, IdentifierType> = {
  'x.com': 'twitter',
  'discord': 'discord',
  'telegram': 'telegram',
  'farcaster': 'farcaster',
};

function parseExplicitPrefix(identifier: string): ParsedIdentifier | null {
  if (!identifier.includes(':')) return null;
  
  const colonIndex = identifier.indexOf(':');
  const prefix = identifier.substring(0, colonIndex).toLowerCase();
  const value = identifier.substring(colonIndex + 1);
  
  if (prefix === 'service') {
    const parts = value.split(':');
    const serviceType = SERVICE_TYPE_MAP[parts[0]];
    if (serviceType) {
      return { type: serviceType, value: parts.slice(1).join(':'), original: identifier };
    }
  }
  
  const type = EXPLICIT_PREFIX_MAP[prefix];
  if (type && type !== 'unknown') {
    return { type, value, original: identifier };
  }
  
  return null;
}

export function parseIdentifier(identifier: string): ParsedIdentifier {
  const trimmed = identifier.trim();
  
  const explicitResult = parseExplicitPrefix(trimmed);
  if (explicitResult) return explicitResult;
  
  if (/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) {
    return { type: 'address', value: trimmed, original: trimmed };
  }
  
  if (trimmed.toLowerCase().endsWith('.eth')) {
    return { type: 'ens', value: trimmed, original: trimmed };
  }
  
  if (/^\d+$/.test(trimmed)) {
    return { type: 'profileId', value: trimmed, original: trimmed };
  }
  
  return { type: 'twitter', value: trimmed, original: trimmed };
}

export function toUserkey(parsed: ParsedIdentifier): string {
  switch (parsed.type) {
    case 'address':
      return `address:${parsed.value}`;
    case 'profileId':
      return `profileId:${parsed.value}`;
    case 'twitter':
      return `service:x.com:${parsed.value}`;
    case 'discord':
      return `service:discord:${parsed.value}`;
    case 'telegram':
      return `service:telegram:${parsed.value}`;
    case 'farcaster':
      return `service:farcaster:${parsed.value}`;
    default:
      return parsed.original;
  }
}

export function isValidIdentifier(identifier: string): boolean {
  return Boolean(identifier && identifier.trim().length > 0);
}

/** @deprecated Use parseIdentifier instead */
export function parseUserkey(identifier: string): string {
  const parsed = parseIdentifier(identifier);
  if (parsed.type === 'address') {
    return `address:${parsed.value}`;
  }
  return identifier;
}
