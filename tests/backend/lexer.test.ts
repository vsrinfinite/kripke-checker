import { describe, it, expect } from 'vitest';
import { tokenize, LexerError } from '../../src/backend/lexer';

describe('lexer', () => {
  it('tokenizes atoms', () => {
    const tokens = tokenize('p');
    expect(tokens[0]).toMatchObject({ type: 'ATOM', value: 'p' });
    expect(tokens[1]).toMatchObject({ type: 'EOF' });
  });

  it('tokenizes multi-char atoms', () => {
    const tokens = tokenize('hello');
    expect(tokens[0]).toMatchObject({ type: 'ATOM', value: 'hello' });
  });

  it('tokenizes Unicode connectives', () => {
    const tokens = tokenize('¬p');
    expect(tokens[0]).toMatchObject({ type: 'NOT', value: '¬' });
    expect(tokens[1]).toMatchObject({ type: 'ATOM', value: 'p' });
  });

  it('tokenizes all Unicode operators', () => {
    const tokens = tokenize('¬ ∧ ∨ → □ ◇ ( )');
    expect(tokens.map(t => t.type)).toEqual(['NOT', 'AND', 'OR', 'IMPLIES', 'BOX', 'DIAMOND', 'LPAREN', 'RPAREN', 'EOF']);
  });

  it('normalizes ASCII input during tokenization', () => {
    const tokens = tokenize('!p & q');
    expect(tokens[0]).toMatchObject({ type: 'NOT' });
    expect(tokens[1]).toMatchObject({ type: 'ATOM', value: 'p' });
    expect(tokens[2]).toMatchObject({ type: 'AND' });
    expect(tokens[3]).toMatchObject({ type: 'ATOM', value: 'q' });
  });

  it('tokenizes [] and <> as box and diamond', () => {
    const tokens = tokenize('[]p');
    expect(tokens[0]).toMatchObject({ type: 'BOX' });
    const tokens2 = tokenize('<>p');
    expect(tokens2[0]).toMatchObject({ type: 'DIAMOND' });
  });

  it('handles whitespace correctly', () => {
    const tokens = tokenize('  p   &   q  ');
    expect(tokens.filter(t => t.type !== 'EOF').length).toBe(3);
  });

  describe('Multi-character handling (No Splitting)', () => {
    it('does not split -> into - and >', () => {
      const tokens = tokenize('p -> q');
      expect(tokens.map(t => t.type)).toEqual(['ATOM', 'IMPLIES', 'ATOM', 'EOF']);
    });

    it('does not split [] into [ and ]', () => {
      const tokens = tokenize('[]p');
      expect(tokens.map(t => t.type)).toEqual(['BOX', 'ATOM', 'EOF']);
    });

    it('does not split <> into < and >', () => {
      const tokens = tokenize('<>q');
      expect(tokens.map(t => t.type)).toEqual(['DIAMOND', 'ATOM', 'EOF']);
    });
  });

  describe('OR symbol and ambiguity', () => {
    it('tokenizes p | q as OR', () => {
      const tokens = tokenize('p | q');
      expect(tokens.map(t => t.type)).toEqual(['ATOM', 'OR', 'ATOM', 'EOF']);
    });

    it('tokenizes p \\/ q as OR', () => {
      const tokens = tokenize('p \\/ q');
      expect(tokens.map(t => t.type)).toEqual(['ATOM', 'OR', 'ATOM', 'EOF']);
    });

    it('treats v as an ATOM, NOT an OR operator', () => {
      const tokens = tokenize('p v q');
      expect(tokens.map(t => t.type)).toEqual(['ATOM', 'ATOM', 'ATOM', 'EOF']);
    });
  });

  describe('Complex formulas EXACT match', () => {
    it('!(p /\\ q) → NOT, LPAREN, ATOM, AND, ATOM, RPAREN', () => {
      const tokens = tokenize('!(p /\\ q)');
      expect(tokens.map(t => t.type)).toEqual(['NOT', 'LPAREN', 'ATOM', 'AND', 'ATOM', 'RPAREN', 'EOF']);
    });
  });

  it('records positions', () => {
    const tokens = tokenize('p ∧ q');
    expect(tokens[0].position).toBe(0);
    expect(tokens[2].position).toBe(4);
  });

  it('throws on invalid characters', () => {
    expect(() => tokenize('p # q')).toThrow(LexerError);
  });

  it('throws with position info', () => {
    try {
      tokenize('p @ q');
    } catch (e) {
      expect(e).toBeInstanceOf(LexerError);
      expect((e as LexerError).position).toBe(2);
    }
  });

  it('tokenizes complex formula', () => {
    const tokens = tokenize('[](p -> <>q) /\\ r');
    const types = tokens.map(t => t.type);
    expect(types).toEqual(['BOX', 'LPAREN', 'ATOM', 'IMPLIES', 'DIAMOND', 'ATOM', 'RPAREN', 'AND', 'ATOM', 'EOF']);
  });

  it('tokenizes atoms with digits', () => {
    const tokens = tokenize('p1');
    expect(tokens[0]).toMatchObject({ type: 'ATOM', value: 'p1' });
  });
});
