import { ValidationError } from '../errors/cli-error.js';

const DECIMALS = 18n;
const DECIMALS_NUMBER = 18;

/**
 * Convert a human-entered credits amount (e.g. "10", "2.5") to a wei string.
 * Uses string/BigInt math throughout so precision is never lost to float rounding.
 */
export function creditsToWei(amount: string): string {
  const trimmed = amount.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new ValidationError(
      `Invalid amount: "${amount}". Use a plain decimal number, e.g. 10 or 2.5.`,
    );
  }

  const [wholePart, fractionPart = ''] = trimmed.split('.');

  if (fractionPart.length > DECIMALS_NUMBER) {
    throw new ValidationError(
      `Amount "${amount}" has too many decimal places (max ${DECIMALS_NUMBER}).`,
    );
  }

  const paddedFraction = fractionPart.padEnd(DECIMALS_NUMBER, '0');
  const wei = BigInt(wholePart || '0') * 10n ** DECIMALS + BigInt(paddedFraction || '0');

  return wei.toString();
}

/**
 * Parse a slippage flag as a fraction. The server rejects values above 0.5
 * (50%), so validate the same bound client-side for a clear early error.
 */
export function parseSlippage(raw: string): number {
  const value = Number(raw);

  if (Number.isNaN(value) || value < 0 || value > 0.5) {
    throw new ValidationError(
      `Invalid slippage value: "${raw}". Use a fraction between 0 and 0.5 (e.g. 0.02 = 2%).`,
    );
  }

  return value;
}

/** Convert a wei string to a human-readable credits string, trimming trailing zeros. */
export function weiToCredits(wei: string | undefined): string {
  if (!wei) return '—';
  const cleanWei = wei.replace(/n$/, '');
  const value = BigInt(cleanWei);
  const whole = value / 10n ** DECIMALS;
  const fraction = value % 10n ** DECIMALS;

  if (fraction === 0n) return whole.toString();

  const fractionStr = fraction.toString().padStart(DECIMALS_NUMBER, '0').replace(/0+$/, '');

  return `${whole}.${fractionStr}`;
}
