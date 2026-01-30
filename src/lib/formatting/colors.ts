/**
 * Custom color utilities for Ethos CLI branding
 * Uses ANSI true color (24-bit) escape codes for precise colors
 */

// Ethos brand color: #C1C0B6 (warm gray/beige)
// RGB: 193, 192, 182
const ETHOS_GRAY_RGB = [193, 192, 182] as const;

/**
 * Apply Ethos brand gray color (#C1C0B6) to text
 * Uses ANSI true color escape codes (supported by most modern terminals)
 */
export function ethosGray(text: string): string {
  const [r, g, b] = ETHOS_GRAY_RGB;
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

/**
 * Apply Ethos brand gray as bold
 */
export function ethosGrayBold(text: string): string {
  const [r, g, b] = ETHOS_GRAY_RGB;
  return `\x1b[1m\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}
