/**
 * ASCII ↔ Unicode symbol mapping layer for modal logic connectives.
 *
 * 1-to-1 dictionary conversion between keyboard-friendly ASCII inputs and display Unicode symbols.
 *
 * IMPORTANT: Raw lowercase `v` is NOT an alias for ∨ because single lowercase letters are valid atomic propositions, which would create ambiguity.
 */

// Multi-char ASCII aliases (order matters: longer first)

const MULTI_CHAR_ALIASES: [string, string][] = [
  ['/\\', '∧'],
  ['\\/', '∨'],
  ['->', '→'],
  ['[]', '□'],
  ['<>', '◇'],
];

// Single-char ASCII aliases

const SINGLE_CHAR_ALIASES: Record<string, string> = {
  '!': '¬',
  '~': '¬',
  '&': '∧',
  '^': '∧',
  '|': '∨',
};

// Unicode → ASCII (canonical reverse)

const UNICODE_TO_ASCII: Record<string, string> = {
  '¬': '!',
  '∧': '&',
  '∨': '|',
  '→': '->',
  '□': '[]',
  '◇': '<>',
};

/**
 * Convert an ASCII alias to its Unicode equivalent.
 * Returns the input unchanged if it is not a recognized alias.
 */
export function asciiToUnicode(input: string): string {
  // Check multi-char aliases first
  for (const [ascii, unicode] of MULTI_CHAR_ALIASES) {
    if (input === ascii) return unicode;
  }
  // Check single-char aliases
  return SINGLE_CHAR_ALIASES[input] ?? input;
}

/**
 * Convert a Unicode symbol to its ASCII equivalent.
 * Return the input unchanged if it is not a recognized symbol.
 */
export function unicodeToAscii(input: string): string {
  return UNICODE_TO_ASCII[input] ?? input;
}

/**
 * Normalize a formula string by replacing all ASCII aliases with Unicode equivalents.
 * Primary input normalization function for the parser pipeline.
 */
export function normalizeInput(input: string): string {
  let result = input;

  // Replace multi-char aliases first (order matters to avoid partial matches)
  for (const [ascii, unicode] of MULTI_CHAR_ALIASES) {
    result = result.split(ascii).join(unicode);
  }

  // Replace single-char aliases
  let output = '';
  for (const ch of result) {
    output += SINGLE_CHAR_ALIASES[ch] ?? ch;
  }

  return output;
}

// Convert a formula string from canonical Unicode back to ASCII display.
export function toAsciiDisplay(input: string): string {
  let result = '';
  for (const ch of input) {
    result += UNICODE_TO_ASCII[ch] ?? ch;
  }
  return result;
}

// Get a human-readable table of all supported aliases
export function getAliasTable(): { ascii: string; unicode: string; description: string }[] {
  return [
    { ascii: '!  or  ~', unicode: '¬', description: 'Negation' },
    { ascii: '&  or  ^  or  /\\', unicode: '∧', description: 'Conjunction' },
    { ascii: '|  or  \\/', unicode: '∨', description: 'Disjunction' },
    { ascii: '->', unicode: '→', description: 'Implication' },
    { ascii: '[]', unicode: '□', description: 'Box (necessity)' },
    { ascii: '<>', unicode: '◇', description: 'Diamond (possibility)' },
  ];
}
