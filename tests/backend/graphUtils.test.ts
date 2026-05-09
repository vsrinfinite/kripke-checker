import { describe, it, expect } from 'vitest';
import { extractAtoms, extractAtomSet } from '../../src/backend/ast';
import { atom, not, and, or, implies, box, diamond } from '../../src/backend/ast';
import { filterValuationByAtoms } from '../../src/backend/graphUtils';
import { modelToDot } from '../../src/backend/dot';
import type { KripkeModel } from '../../src/backend/types';

describe('graphUtils', () => {
  describe('extractAtomSet', () => {
    it('extracts atoms as a Set', () => {
      const f = and(atom('p'), or(atom('q'), atom('p')));
      const result = extractAtomSet(f);
      expect(result).toEqual(new Set(['p', 'q']));
    });

    it('returns empty set for formula with no atoms (impossible in practice, but tests edge)', () => {
      // Atom is always the leaf, but let's test a single atom
      const result = extractAtomSet(atom('x'));
      expect(result).toEqual(new Set(['x']));
    });

    it('extracts atoms from nested modal formula', () => {
      const f = box(implies(atom('p'), diamond(atom('q'))));
      const result = extractAtomSet(f);
      expect(result).toEqual(new Set(['p', 'q']));
    });

    it('handles formula with single atom used multiple times', () => {
      const f = and(atom('p'), not(atom('p')));
      const result = extractAtomSet(f);
      expect(result).toEqual(new Set(['p']));
    });
  });

  describe('filterValuationByAtoms', () => {
    const valuation = {
      p: ['w0', 'w1'],
      q: ['w1', 'w2'],
      r: ['w0'],
    };

    it('filters to matching atoms only', () => {
      const filtered = filterValuationByAtoms(valuation, new Set(['p', 'q']));
      expect(filtered).toEqual({
        p: ['w0', 'w1'],
        q: ['w1', 'w2'],
      });
    });

    it('empty atom set returns empty valuation', () => {
      const filtered = filterValuationByAtoms(valuation, new Set());
      expect(filtered).toEqual({});
    });

    it('full atom set returns same valuation', () => {
      const filtered = filterValuationByAtoms(valuation, new Set(['p', 'q', 'r']));
      expect(filtered).toEqual(valuation);
    });

    it('atoms not in valuation are harmlessly ignored', () => {
      const filtered = filterValuationByAtoms(valuation, new Set(['p', 'z']));
      expect(filtered).toEqual({ p: ['w0', 'w1'] });
    });

    it('does not mutate the original valuation', () => {
      const original = { ...valuation };
      filterValuationByAtoms(valuation, new Set(['p']));
      expect(valuation).toEqual(original);
    });
  });

  describe('DOT atomFilter', () => {
    const testModel: KripkeModel = {
      worlds: ['w0', 'w1'],
      edges: { w0: ['w1'] },
      valuation: { p: ['w0', 'w1'], q: ['w0'], r: ['w1'] },
    };

    it('full model mode shows all atoms in labels', () => {
      const dot = modelToDot(testModel);
      expect(dot).toContain('p');
      expect(dot).toContain('q');
      expect(dot).toContain('r');
    });

    it('atomFilter restricts displayed atoms', () => {
      const dot = modelToDot(testModel, { atomFilter: ['p'] });
      // p should appear in labels
      expect(dot).toContain('p');
      // q and r should NOT appear in node labels (but might appear in other contexts)
      // Check that "q" does not appear inside the node label pattern
      const nodeLines = dot.split('\n').filter(l => l.includes('label='));
      for (const line of nodeLines) {
        expect(line).not.toContain('q');
        expect(line).not.toContain('r');
      }
    });

    it('empty atomFilter hides all atoms from labels', () => {
      const dot = modelToDot(testModel, { atomFilter: [] });
      const nodeLines = dot.split('\n').filter(l => l.includes('label='));
      for (const line of nodeLines) {
        // Only world names should appear, no atom sets
        expect(line).not.toContain('{');
      }
    });

    it('atomFilter does not affect edges', () => {
      const dot = modelToDot(testModel, { atomFilter: ['p'] });
      expect(dot).toContain('"w0" -> "w1"');
    });
  });

  describe('semantic safety: Formula-Aware mode does not alter model', () => {
    it('filtering valuation preserves original model', () => {
      const model: KripkeModel = {
        worlds: ['w0', 'w1'],
        edges: { w0: ['w1'] },
        valuation: { p: ['w0'], q: ['w1'] },
      };
      const formulaAtoms = new Set(['p']);
      const filtered = filterValuationByAtoms(model.valuation, formulaAtoms);

      // Filtered valuation should only have p
      expect(filtered).toEqual({ p: ['w0'] });

      // Original model is untouched
      expect(model.valuation).toEqual({ p: ['w0'], q: ['w1'] });
    });
  });
});
