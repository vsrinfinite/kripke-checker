import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/backend/checker';
import { parse } from '../../src/backend/parser';
import type { KripkeModel } from '../../src/backend/types';

// Standard test model:
//   w0 (p,q) → w1 (p) → w2 (q)
//   w0 → w4 (p,q) [dead-end]
//   w1 → w3 () → w4 (p,q)
//   w2 → w4 (p,q)
const standardModel: KripkeModel = {
  worlds: ['w0', 'w1', 'w2', 'w3', 'w4'],
  edges: {
    w0: ['w1', 'w4'],
    w1: ['w2', 'w3'],
    w2: ['w4'],
    w3: ['w4'],
  },
  valuation: {
    p: ['w0', 'w1', 'w4'],
    q: ['w0', 'w2', 'w4'],
  },
};

describe('checker', () => {
  describe('atoms', () => {
    it('p is true at w0', () => {
      const r = evaluate(parse('p'), standardModel, 'w0');
      expect(r.result).toBe(true);
    });
    it('p is false at w2', () => {
      const r = evaluate(parse('p'), standardModel, 'w2');
      expect(r.result).toBe(false);
    });
    it('q is true at w2', () => {
      const r = evaluate(parse('q'), standardModel, 'w2');
      expect(r.result).toBe(true);
    });
  });

  describe('negation', () => {
    it('¬p is false at w0', () => {
      const r = evaluate(parse('¬p'), standardModel, 'w0');
      expect(r.result).toBe(false);
    });
    it('¬p is true at w2', () => {
      const r = evaluate(parse('¬p'), standardModel, 'w2');
      expect(r.result).toBe(true);
    });
  });

  describe('conjunction', () => {
    it('p ∧ q at w0', () => {
      const r = evaluate(parse('p ∧ q'), standardModel, 'w0');
      expect(r.result).toBe(true);
    });
    it('p ∧ q at w1', () => {
      const r = evaluate(parse('p ∧ q'), standardModel, 'w1');
      expect(r.result).toBe(false);
    });
  });

  describe('disjunction', () => {
    it('p ∨ q at w1', () => {
      const r = evaluate(parse('p ∨ q'), standardModel, 'w1');
      expect(r.result).toBe(true);
    });
    it('p ∨ q at w3', () => {
      const r = evaluate(parse('p ∨ q'), standardModel, 'w3');
      expect(r.result).toBe(false);
    });
  });

  describe('implication', () => {
    it('p → q at w0', () => {
      const r = evaluate(parse('p → q'), standardModel, 'w0');
      expect(r.result).toBe(true);
    });
    it('p → q at w1 (p true, q false)', () => {
      const r = evaluate(parse('p → q'), standardModel, 'w1');
      expect(r.result).toBe(false);
    });
    it('p → q at w3 (p false, vacuously true)', () => {
      const r = evaluate(parse('p → q'), standardModel, 'w3');
      expect(r.result).toBe(true);
    });
  });

  describe('box', () => {
    it('□p at w0 (successors w1,w4 both have p)', () => {
      const r = evaluate(parse('□p'), standardModel, 'w0');
      expect(r.result).toBe(true);
    });
    it('□q at w0 (w1 does not have q)', () => {
      const r = evaluate(parse('□q'), standardModel, 'w0');
      expect(r.result).toBe(false);
    });
    it('□p at w4 (dead-end, vacuously true)', () => {
      const r = evaluate(parse('□p'), standardModel, 'w4');
      expect(r.result).toBe(true);
    });
  });

  describe('diamond', () => {
    it('◇q at w0 (w4 has q)', () => {
      const r = evaluate(parse('◇q'), standardModel, 'w0');
      expect(r.result).toBe(true);
    });
    it('◇q at w4 (dead-end, false)', () => {
      const r = evaluate(parse('◇q'), standardModel, 'w4');
      expect(r.result).toBe(false);
    });
  });

  describe('nested formulas', () => {
    it('□(p → ◇q) at w0 is false (w4 is dead-end with p but no ◇q)', () => {
      const r = evaluate(parse('□(p → ◇q)'), standardModel, 'w0');
      // w4 has p=true but no successors, so ◇q is false at w4
      expect(r.result).toBe(false);
    });
    it('◇□p at w0', () => {
      const r = evaluate(parse('◇□p'), standardModel, 'w0');
      // w4 is a dead-end successor of w0, □p is vacuously true at w4
      expect(r.result).toBe(true);
    });
  });

  describe('cyclic model', () => {
    it('handles cycles correctly', () => {
      const cyclic: KripkeModel = {
        worlds: ['a', 'b'],
        edges: { a: ['b'], b: ['a'] },
        valuation: { p: ['a'] },
      };
      const r = evaluate(parse('□◇p'), cyclic, 'a');
      // a→b, b→a. ◇p at b: successor a has p → true. □◇p at a: successor b has ◇p → true.
      expect(r.result).toBe(true);
    });
  });

  describe('branching model', () => {
    it('handles branching', () => {
      const branching: KripkeModel = {
        worlds: ['w0', 'w1', 'w2'],
        edges: { w0: ['w1', 'w2'] },
        valuation: { p: ['w1'] },
      };
      const r = evaluate(parse('◇p'), branching, 'w0');
      expect(r.result).toBe(true);
    });
  });

  describe('truth sets', () => {
    it('returns truth sets for all subformulas', () => {
      const r = evaluate(parse('p ∧ q'), standardModel, 'w0');
      expect(r.truthSets.length).toBeGreaterThan(0);
      const pSet = r.truthSets.find(ts => ts.formula === 'p');
      expect(pSet).toBeDefined();
      expect(pSet!.worlds).toContain('w0');
    });
  });

  describe('witnesses and counterexamples', () => {
    it('returns witnesses for ◇', () => {
      const r = evaluate(parse('◇q'), standardModel, 'w0');
      expect(r.witnesses.length).toBeGreaterThan(0);
      expect(r.witnesses[0].witnesses.length).toBeGreaterThan(0);
    });
    it('returns counterexamples for □ failure', () => {
      const r = evaluate(parse('□q'), standardModel, 'w0');
      expect(r.result).toBe(false);
      expect(r.counterexamples.length).toBeGreaterThan(0);
    });
  });

  describe('trace', () => {
    it('returns trace entries', () => {
      const r = evaluate(parse('p ∧ q'), standardModel, 'w0');
      expect(r.trace.length).toBeGreaterThan(0);
      for (const t of r.trace) {
        expect(t.formula).toBeTruthy();
        expect(t.reason).toBeTruthy();
      }
    });
  });
});
