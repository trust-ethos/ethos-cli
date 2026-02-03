export type IdentifierType = 
  | 'address'
  | 'discord'
  | 'ens'
  | 'farcaster'
  | 'profileId'
  | 'telegram'
  | 'twitter'
  | 'unknown';

export interface ParsedIdentifier {
  original: string;
  type: IdentifierType;
  value: string;
}

const EXPLICIT_PREFIX_MAP: Record<string, IdentifierType> = {
  'address': 'address',
  'discord': 'discord',
  'farcaster': 'farcaster',
  'profile': 'profileId',
  'profileid': 'profileId',
  'service': 'unknown',
  'telegram': 'telegram',
  'twitter': 'twitter',
  'x': 'twitter',
};

const SERVICE_TYPE_MAP: Record<string, IdentifierType> = {
  'discord': 'discord',
  'farcaster': 'farcaster',
  'telegram': 'telegram',
  'x.com': 'twitter',
};

function parseExplicitPrefix(identifier: string): null | ParsedIdentifier {
  if (!identifier.includes(':')) return null;
  
  const colonIndex = identifier.indexOf(':');
  const prefix = identifier.slice(0, Math.max(0, colonIndex)).toLowerCase();
  const value = identifier.slice(Math.max(0, colonIndex + 1));
  
  if (prefix === 'service') {
    const parts = value.split(':');
    const serviceType = SERVICE_TYPE_MAP[parts[0]];
    if (serviceType) {
      return { original: identifier, type: serviceType, value: parts.slice(1).join(':') };
    }
  }
  
  const type = EXPLICIT_PREFIX_MAP[prefix];
  if (type && type !== 'unknown') {
    return { original: identifier, type, value };
  }
  
  return null;
}

export function parseIdentifier(identifier: string): ParsedIdentifier {
  const trimmed = identifier.trim();
  
  const explicitResult = parseExplicitPrefix(trimmed);
  if (explicitResult) return explicitResult;
  
  if (/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) {
    return { original: trimmed, type: 'address', value: trimmed };
  }
  
  if (trimmed.toLowerCase().endsWith('.eth')) {
    return { original: trimmed, type: 'ens', value: trimmed };
  }
  
  if (/^\d+$/.test(trimmed)) {
    return { original: trimmed, type: 'profileId', value: trimmed };
  }
  
  return { original: trimmed, type: 'twitter', value: trimmed };
}

export function toUserkey(parsed: ParsedIdentifier): string {
  switch (parsed.type) {
    case 'address': {
      return `address:${parsed.value}`;
    }

    case 'discord': {
      return `service:discord:${parsed.value}`;
    }

    case 'farcaster': {
      return `service:farcaster:${parsed.value}`;
    }

    case 'profileId': {
      return `profileId:${parsed.value}`;
    }

    case 'telegram': {
      return `service:telegram:${parsed.value}`;
    }

    case 'twitter': {
      return `service:x.com:${parsed.value}`;
    }

    default: {
      return parsed.original;
    }
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
