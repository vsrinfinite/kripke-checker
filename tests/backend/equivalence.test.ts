import { describe, it, expect } from 'vitest';
import { areEquivalent } from '../../src/backend/normalizer';
import { evaluate } from '../../src/backend/checker';
import { parse } from '../../src/backend/parser';
import { atom, not, box, diamond } from '../../src/backend/ast';
import type { KripkeModel } from '../../src/backend/types';

const model: KripkeModel = {
  worlds: ['w0', 'w1', 'w2'],
  edges: { w0: ['w1', 'w2'], w1: ['w2'] },
  valuation: { p: ['w0', 'w1'], q: ['w0', 'w2'] },
};

describe('equivalence', () => {
  describe('normalization equivalence', () => {
    it('□p ≡ ¬◇¬p', () => {
      expect(areEquivalent(box(atom('p')), not(diamond(not(atom('p')))))).toBe(true);
    });
    it('◇p ≡ ¬□¬p', () => {
      expect(areEquivalent(diamond(atom('p')), not(box(not(atom('p')))))).toBe(true);
    });
    it('¬¬p ≡ p', () => {
      expect(areEquivalent(not(not(atom('p'))), atom('p'))).toBe(true);
    });
    it('p ∧ q ≢ p ∨ q', () => {
      expect(areEquivalent(parse('p ∧ q'), parse('p ∨ q'))).toBe(false);
    });

    // Complex structural equivalences
    it('□(p ∧ q) ≡ ¬◇¬(p ∧ q)', () => {
      expect(areEquivalent(parse('□(p ∧ q)'), parse('¬◇¬(p ∧ q)'))).toBe(true);
    });
    it('◇(p ∨ q) ≡ ¬□¬(p ∨ q)', () => {
      expect(areEquivalent(parse('◇(p ∨ q)'), parse('¬□¬(p ∨ q)'))).toBe(true);
    });
    it('□(p → ◇q) ≡ ¬◇¬(p → ◇q)', () => {
      expect(areEquivalent(parse('□(p → ◇q)'), parse('¬◇¬(p → ◇q)'))).toBe(true);
    });
    it('¬◇¬(p ∧ □q) ≡ □(p ∧ □q)', () => {
      expect(areEquivalent(parse('¬◇¬(p ∧ □q)'), parse('□(p ∧ □q)'))).toBe(true);
    });
    it('¬¬◇¬¬p ≡ ◇p', () => {
      expect(areEquivalent(parse('¬¬◇¬¬p'), parse('◇p'))).toBe(true);
    });
    it('¬¬□p ≡ □p', () => {
      expect(areEquivalent(parse('¬¬□p'), parse('□p'))).toBe(true);
    });
    it('¬¬◇(p ∨ q) ≡ ◇(p ∨ q)', () => {
      expect(areEquivalent(parse('¬¬◇(p ∨ q)'), parse('◇(p ∨ q)'))).toBe(true);
    });
  });

  describe('semantic equivalence', () => {
    it('□p and ¬◇¬p have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('□p'), model, w);
        const r2 = evaluate(parse('¬◇¬p'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });
    it('◇p and ¬□¬p have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('◇p'), model, w);
        const r2 = evaluate(parse('¬□¬p'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });
    it('¬¬p and p have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('¬¬p'), model, w);
        const r2 = evaluate(parse('p'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });
    it('p → q and ¬p ∨ q have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('p → q'), model, w);
        const r2 = evaluate(parse('¬p ∨ q'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });

    // Complex semantic equivalences
    it('□(p ∧ q) and ¬◇¬(p ∧ q) have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('□(p ∧ q)'), model, w);
        const r2 = evaluate(parse('¬◇¬(p ∧ q)'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });
    it('◇(p ∨ q) and ¬□¬(p ∨ q) have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('◇(p ∨ q)'), model, w);
        const r2 = evaluate(parse('¬□¬(p ∨ q)'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });
    it('□(p → ◇q) and ¬◇¬(p → ◇q) have same truth value everywhere', () => {
      for (const w of model.worlds) {
        const r1 = evaluate(parse('□(p → ◇q)'), model, w);
        const r2 = evaluate(parse('¬◇¬(p → ◇q)'), model, w);
        expect(r1.result).toBe(r2.result);
      }
    });
  });

  describe('Property-style Duality Tests (Universal Guarantee)', () => {
    it('universally holds that □φ ≡ ¬◇¬φ and ◇φ ≡ ¬□¬φ across varying subformulas and worlds', () => {
      // A diverse set of test formulas φ
      const phiFormulas = [
        'p',
        'p ∧ q',
        '□p',
        '◇(p → q)',
        '¬◇(p ∨ □q)',
        '!!p'
      ];

      // A cyclic, branching test model
      const testModel: KripkeModel = {
        worlds: ['w0', 'w1', 'w2'],
        edges: { w0: ['w1', 'w2'], w1: ['w2'], w2: ['w0'] },
        valuation: { p: ['w1'], q: ['w2'] },
        startWorld: 'w0'
      };

      for (const fStr of phiFormulas) {
        const phi = parse(fStr);

        // Property 1: □φ ≡ ¬◇¬φ
        const boxPhi = box(phi);
        const notDiaNotPhi = not(diamond(not(phi)));

        // Property 2: ◇φ ≡ ¬□¬φ
        const diaPhi = diamond(phi);
        const notBoxNotPhi = not(box(not(phi)));

        for (const w of testModel.worlds) {
          // Both evaluating the same mathematically
          expect(evaluate(boxPhi, testModel, w).result).toBe(evaluate(notDiaNotPhi, testModel, w).result);
          expect(evaluate(diaPhi, testModel, w).result).toBe(evaluate(notBoxNotPhi, testModel, w).result);
        }
      }
    });
  });
});
