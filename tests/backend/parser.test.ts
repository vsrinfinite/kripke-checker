import { describe, it, expect } from 'vitest';
import { parse, ParseError } from '../../src/backend/parser';

describe('parser', () => {
  describe('atoms', () => {
    it('parses single atom', () => {
      expect(parse('p')).toEqual({ type: 'atom', name: 'p' });
    });
    it('parses multi-char atom', () => {
      expect(parse('hello')).toEqual({ type: 'atom', name: 'hello' });
    });
  });

  describe('negation', () => {
    it('parses ¬p', () => {
      expect(parse('¬p')).toEqual({ type: 'not', operand: { type: 'atom', name: 'p' } });
    });
    it('parses !p (ASCII)', () => {
      expect(parse('!p')).toEqual({ type: 'not', operand: { type: 'atom', name: 'p' } });
    });
    it('parses double negation', () => {
      const result = parse('¬¬p');
      expect(result).toEqual({ type: 'not', operand: { type: 'not', operand: { type: 'atom', name: 'p' } } });
    });
  });

  describe('binary operators', () => {
    it('parses p ∧ q', () => {
      const r = parse('p ∧ q');
      expect(r.type).toBe('and');
    });
    it('parses p ∨ q', () => {
      const r = parse('p ∨ q');
      expect(r.type).toBe('or');
    });
    it('parses p → q', () => {
      const r = parse('p → q');
      expect(r).toEqual({ type: 'implies', left: { type: 'atom', name: 'p' }, right: { type: 'atom', name: 'q' } });
    });
  });

  describe('modal operators', () => {
    it('parses □p', () => {
      expect(parse('□p')).toEqual({ type: 'box', operand: { type: 'atom', name: 'p' } });
    });
    it('parses ◇p', () => {
      expect(parse('◇p')).toEqual({ type: 'diamond', operand: { type: 'atom', name: 'p' } });
    });
    it('parses []p (ASCII)', () => {
      expect(parse('[]p')).toEqual({ type: 'box', operand: { type: 'atom', name: 'p' } });
    });
    it('parses <>p (ASCII)', () => {
      expect(parse('<>p')).toEqual({ type: 'diamond', operand: { type: 'atom', name: 'p' } });
    });
  });

  describe('precedence', () => {
    it('→ has lowest precedence', () => {
      const r = parse('p ∧ q → r');
      expect(r.type).toBe('implies');
      if (r.type === 'implies') {
        expect(r.left.type).toBe('and');
        expect(r.right.type).toBe('atom');
      }
    });
    it('∨ binds tighter than →', () => {
      const r = parse('p ∨ q → r');
      expect(r.type).toBe('implies');
      if (r.type === 'implies') expect(r.left.type).toBe('or');
    });
    it('∧ binds tighter than ∨', () => {
      const r = parse('p ∧ q ∨ r');
      expect(r.type).toBe('or');
      if (r.type === 'or') expect(r.left.type).toBe('and');
    });
    it('¬ binds tighter than ∧', () => {
      const r = parse('¬p ∧ q');
      expect(r.type).toBe('and');
      if (r.type === 'and') expect(r.left.type).toBe('not');
    });
    it('□ binds tighter than ∧', () => {
      const r = parse('□p ∧ q');
      expect(r.type).toBe('and');
      if (r.type === 'and') expect(r.left.type).toBe('box');
    });
    it('→ is right-associative', () => {
      const r = parse('p → q → r');
      expect(r.type).toBe('implies');
      if (r.type === 'implies') {
        expect(r.left.type).toBe('atom');
        expect(r.right.type).toBe('implies');
      }
    });
    it('∧ is left-associative', () => {
      const r = parse('p ∧ q ∧ r');
      expect(r.type).toBe('and');
      if (r.type === 'and') {
        expect(r.left.type).toBe('and');
        expect(r.right.type).toBe('atom');
      }
    });
  });

  describe('parentheses', () => {
    it('overrides precedence', () => {
      const r = parse('p ∧ (q ∨ r)');
      expect(r.type).toBe('and');
      if (r.type === 'and') expect(r.right.type).toBe('or');
    });
    it('fully parenthesized formula', () => {
      const r = parse('((p) ∧ (q))');
      expect(r.type).toBe('and');
    });
    it('nested parentheses', () => {
      const r = parse('(((p)))');
      expect(r.type).toBe('atom');
    });
  });

  describe('complex formulas', () => {
    it('parses □(p → ◇q)', () => {
      const r = parse('□(p → ◇q)');
      expect(r.type).toBe('box');
      if (r.type === 'box') {
        expect(r.operand.type).toBe('implies');
      }
    });
    it('parses ASCII: [](p -> <>q) /\\ r', () => {
      const r = parse('[](p -> <>q) /\\ r');
      expect(r.type).toBe('and');
    });
  });

  describe('error handling edge cases', () => {
    it('rejects empty formula', () => {
      expect(() => parse('')).toThrow('Empty formula');
    });
    it('rejects unclosed paren: (p ∧ q', () => {
      expect(() => parse('(p ∧ q')).toThrow("Expected RPAREN but got EOF ('') at position 6");
    });
    it('rejects trailing operator: p ->', () => {
      expect(() => parse('p ->')).toThrow("Unexpected token '' at position 3. Expected atom or '('");
    });
    it('rejects leading operator: -> p', () => {
      expect(() => parse('-> p')).toThrow("Unexpected token '→' at position 0. Expected atom or '('");
    });
    it('rejects empty modal operand: []()', () => {
      expect(() => parse('[]()')).toThrow("Unexpected token ')' at position 2. Expected atom or '('");
    });
    it('rejects double binary operator', () => {
      expect(() => parse('p ∧ ∧ q')).toThrow('Unexpected token');
    });
    it('rejects ambiguity: p v q', () => {
      expect(() => parse('p v q')).toThrow("Unexpected token 'v' at position 2");
    });
  });

  describe('atom limits', () => {
    it('rejects formula exceeding maxAtoms', () => {
      expect(() => parse('p ∧ q ∧ r', { maxAtoms: 2 })).toThrow(ParseError);
    });
    it('allows formula within maxAtoms', () => {
      expect(() => parse('p ∧ q', { maxAtoms: 2 })).not.toThrow();
    });
    it('rejects formula exceeding maxFormulaDepth', () => {
      expect(() => parse('□□□p', { maxFormulaDepth: 2 })).toThrow(ParseError);
    });
  });
});
