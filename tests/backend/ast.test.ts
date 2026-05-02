import { describe, it, expect } from 'vitest';
import {
  atom, not, and, or, implies, box, diamond,
  prettyPrint, formulaSize, formulaDepth,
  subformulas, extractAtoms, structuralEquals, clone, formulaToString,
} from '../../src/backend/ast';

describe('ast', () => {
  describe('prettyPrint', () => {
    it('prints atom', () => expect(prettyPrint(atom('p'))).toBe('p'));
    it('prints negation', () => expect(prettyPrint(not(atom('p')))).toBe('¬p'));
    it('prints conjunction', () => expect(prettyPrint(and(atom('p'), atom('q')))).toBe('p ∧ q'));
    it('prints disjunction', () => expect(prettyPrint(or(atom('p'), atom('q')))).toBe('p ∨ q'));
    it('prints implication', () => expect(prettyPrint(implies(atom('p'), atom('q')))).toBe('p → q'));
    it('prints box', () => expect(prettyPrint(box(atom('p')))).toBe('□p'));
    it('prints diamond', () => expect(prettyPrint(diamond(atom('p')))).toBe('◇p'));
    it('prints complex formula', () => {
      const f = box(implies(atom('p'), diamond(atom('q'))));
      expect(prettyPrint(f)).toBe('□(p → ◇q)');
    });
    it('minimizes parentheses based on precedence', () => {
      const f = implies(and(atom('p'), atom('q')), atom('r'));
      expect(prettyPrint(f)).toBe('p ∧ q → r');
    });
  });

  describe('formulaSize', () => {
    it('atom has size 1', () => expect(formulaSize(atom('p'))).toBe(1));
    it('¬p has size 2', () => expect(formulaSize(not(atom('p')))).toBe(2));
    it('p ∧ q has size 3', () => expect(formulaSize(and(atom('p'), atom('q')))).toBe(3));
    it('nested formula', () => {
      expect(formulaSize(box(implies(atom('p'), diamond(atom('q')))))).toBe(5);
    });
  });

  describe('formulaDepth', () => {
    it('atom has depth 0', () => expect(formulaDepth(atom('p'))).toBe(0));
    it('¬p has depth 1', () => expect(formulaDepth(not(atom('p')))).toBe(1));
    it('p ∧ q has depth 1', () => expect(formulaDepth(and(atom('p'), atom('q')))).toBe(1));
    it('□(p → ◇q) has depth 3', () => {
      expect(formulaDepth(box(implies(atom('p'), diamond(atom('q')))))).toBe(3);
    });
  });

  describe('subformulas', () => {
    it('atom returns itself', () => {
      const subs = subformulas(atom('p'));
      expect(subs.length).toBe(1);
    });
    it('returns sorted by size', () => {
      const f = and(atom('p'), atom('q'));
      const subs = subformulas(f);
      expect(subs.length).toBe(3);
      expect(subs[0].type).toBe('atom');
      expect(subs[subs.length - 1]).toEqual(f);
    });
    it('deduplicates', () => {
      const f = and(atom('p'), atom('p'));
      const subs = subformulas(f);
      expect(subs.length).toBe(2); // p, p ∧ p
    });
  });

  describe('extractAtoms', () => {
    it('finds all atoms', () => {
      const f = and(atom('p'), or(atom('q'), atom('p')));
      expect(extractAtoms(f)).toEqual(['p', 'q']);
    });
    it('returns sorted', () => {
      const f = and(atom('z'), atom('a'));
      expect(extractAtoms(f)).toEqual(['a', 'z']);
    });
  });

  describe('structuralEquals', () => {
    it('equal atoms', () => expect(structuralEquals(atom('p'), atom('p'))).toBe(true));
    it('different atoms', () => expect(structuralEquals(atom('p'), atom('q'))).toBe(false));
    it('different types', () => expect(structuralEquals(atom('p'), not(atom('p')))).toBe(false));
    it('equal complex formulas', () => {
      const a = box(implies(atom('p'), diamond(atom('q'))));
      const b = box(implies(atom('p'), diamond(atom('q'))));
      expect(structuralEquals(a, b)).toBe(true);
    });
    it('different complex formulas', () => {
      const a = box(implies(atom('p'), diamond(atom('q'))));
      const b = box(implies(atom('p'), diamond(atom('r'))));
      expect(structuralEquals(a, b)).toBe(false);
    });
  });

  describe('clone', () => {
    it('produces equal but distinct tree', () => {
      const f = box(implies(atom('p'), diamond(atom('q'))));
      const c = clone(f);
      expect(structuralEquals(f, c)).toBe(true);
      expect(f).not.toBe(c);
    });
  });

  describe('formulaToString', () => {
    it('canonical string for atom', () => expect(formulaToString(atom('p'))).toBe('p'));
    it('canonical string for negation', () => expect(formulaToString(not(atom('p')))).toBe('(¬ p)'));
    it('canonical string for complex formula', () => {
      const f = and(atom('p'), atom('q'));
      expect(formulaToString(f)).toBe('(p ∧ q)');
    });
    it('different formulas have different strings', () => {
      expect(formulaToString(and(atom('p'), atom('q')))).not.toBe(formulaToString(or(atom('p'), atom('q'))));
    });
  });
});
