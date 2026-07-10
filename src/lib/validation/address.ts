import { ValidationError } from '../errors/cli-error.js';

/** Validate an optional 0x wallet-address flag; returns the trimmed address or undefined. */
export function parseAddressFlag(value: string | undefined, flag: string): string | undefined {
  if (value === undefined) return undefined;

  const trimmed = value.trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    throw new ValidationError(`Invalid ${flag} value: "${value}". Use a 0x wallet address.`);
  }

  return trimmed;
}
