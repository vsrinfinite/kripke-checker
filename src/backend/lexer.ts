/**
 * Tokenizer for formulae
 */
import type { Token, TokenType } from './types';
import { normalizeInput } from './symbolMap';

export class LexerError extends Error {
  constructor(message: string, public readonly position: number) {
    super(message);
    this.name = 'LexerError';
  }
}

/**
 * Tokenize a formula string into a list of tokens.
 * Input is first normalized through the symbol map.
 */
export function tokenize(input: string): Token[] {
  const normalized = normalizeInput(input);
  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Unicode connectives (single-char)
    const singleTokens: Record<string, TokenType> = {
      '¬': 'NOT',
      '∧': 'AND',
      '∨': 'OR',
      '→': 'IMPLIES',
      '□': 'BOX',
      '◇': 'DIAMOND',
      '(': 'LPAREN',
      ')': 'RPAREN',
    };

    if (singleTokens[ch]) {
      tokens.push({ type: singleTokens[ch], value: ch, position: i });
      i++;
      continue;
    }

    // Atoms: lowercase letters followed by lowercase letters/digits
    if (/[a-z]/.test(ch)) {
      const start = i;
      while (i < normalized.length && /[a-z0-9]/.test(normalized[i])) {
        i++;
      }
      tokens.push({ type: 'ATOM', value: normalized.slice(start, i), position: start });
      continue;
    }

    throw new LexerError(
      `Unexpected character '${ch}' at position ${i}`,
      i
    );
  }

  tokens.push({ type: 'EOF', value: '', position: i });
  return tokens;
}
