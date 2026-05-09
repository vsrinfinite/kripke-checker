import { describe, it, expect } from 'vitest';
import { checkFormula } from '../../src/backend/service';
import type { CheckRequest, KripkeModel, LogicProfile } from '../../src/backend/types';

const model: KripkeModel = {
  worlds: ['w0', 'w1', 'w2'],
  edges: { w0: ['w1', 'w2'], w1: ['w2'] },
  valuation: { p: ['w0', 'w1'], q: ['w0', 'w2'] },
  startWorld: 'w0',
};

describe('service integration', () => {
  describe('successful checks', () => {
    it('evaluates simple atom', () => {
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0' });
      expect(r.success).toBe(true);
      expect(r.evaluation?.result).toBe(true);
    });

    it('evaluates complex formula', () => {
      const r = checkFormula({ formula: '◇q', model, startWorld: 'w0' });
      expect(r.success).toBe(true);
      expect(r.evaluation?.result).toBe(true);
    });

    it('evaluates ASCII formula', () => {
      const r = checkFormula({ formula: '[]p & q', model, startWorld: 'w0' });
      expect(r.success).toBe(true);
    });

    it('returns truth sets', () => {
      const r = checkFormula({ formula: 'p ∧ q', model, startWorld: 'w0' });
      expect(r.evaluation?.truthSets.length).toBeGreaterThan(0);
    });

    it('returns DOT output', () => {
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0' });
      expect(r.dot).toContain('digraph');
    });
  });

  describe('normalization', () => {
    it('reports normalization when formula is simplified', () => {
      const r = checkFormula({ formula: '!!p', model, startWorld: 'w0' });
      expect(r.success).toBe(true);
      expect(r.normalization?.changed).toBe(true);
      expect(r.normalization?.steps.length).toBeGreaterThan(0);
    });

    it('no normalization for simple formula', () => {
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0' });
      expect(r.normalization?.changed).toBe(false);
    });
  });

  describe('error handling', () => {
    it('reports parse errors', () => {
      const r = checkFormula({ formula: '', model, startWorld: 'w0' });
      expect(r.success).toBe(false);
      expect(r.errors.length).toBeGreaterThan(0);
    });

    it('reports model validation errors', () => {
      const badModel: KripkeModel = { worlds: [], edges: {}, valuation: {} };
      const r = checkFormula({ formula: 'p', model: badModel });
      expect(r.success).toBe(false);
    });

    it('reports invalid start world', () => {
      const r = checkFormula({ formula: 'p', model, startWorld: 'w99' });
      expect(r.success).toBe(false);
      expect(r.errors.some(e => e.includes('w99'))).toBe(true);
    });
  });

  describe('preset mode', () => {
    it('uses S4 preset', () => {
      const profile: LogicProfile = { mode: 'preset', preset: 'S4', constraints: [] };
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0', logicProfile: profile });
      expect(r.success).toBe(true);
      expect(r.constraintResults?.some(c => c.constraint === 'reflexive')).toBe(true);
    });

    it('K preset has no constraint checks', () => {
      const profile: LogicProfile = { mode: 'preset', preset: 'K', constraints: [] };
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0', logicProfile: profile });
      expect(r.constraintResults?.length).toBe(0);
    });
  });

  describe('custom mode', () => {
    it('uses custom constraints', () => {
      const profile: LogicProfile = { mode: 'custom', preset: null, constraints: ['reflexive'] };
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0', logicProfile: profile });
      expect(r.constraintResults?.some(c => c.constraint === 'reflexive')).toBe(true);
    });
  });

  describe('conflicts', () => {
    it('detects and warns about conflicts', () => {
      const profile: LogicProfile = { mode: 'custom', preset: null, constraints: ['empty', 'serial'] };
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0', logicProfile: profile });
      expect(r.warnings.some(w => w.includes('conflict') || w.includes('Constraint'))).toBe(true);
    });
  });

  describe('auto-repair', () => {
    it('repairs model when explicitly requested', () => {
      const profile: LogicProfile = { mode: 'preset', preset: 'T', constraints: [] };
      const r = checkFormula({ formula: 'p', model, startWorld: 'w0', logicProfile: profile, autoRepair: true });
      expect(r.success).toBe(true);
      expect(r.warnings.some(w => w.includes('Auto-repair'))).toBe(true);
    });
  });

  describe('limits', () => {
    it('enforces atom limits', () => {
      const r = checkFormula({ formula: 'p ∧ q ∧ r', model, startWorld: 'w0', limits: { maxAtoms: 2 } });
      expect(r.success).toBe(false);
    });
  });

  describe('explanation traces', () => {
    it('returns trace', () => {
      const r = checkFormula({ formula: '□p', model, startWorld: 'w0' });
      expect(r.evaluation?.trace.length).toBeGreaterThan(0);
    });
  });
});
