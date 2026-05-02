import { describe, it, expect } from 'vitest';
import { validateModel, getSuccessors, getAtomsAtWorld } from '../../src/backend/model';
import type { KripkeModel } from '../../src/backend/types';

const validModel: KripkeModel = {
  worlds: ['w0', 'w1', 'w2'],
  edges: { w0: ['w1', 'w2'], w1: ['w2'] },
  valuation: { p: ['w0', 'w1'], q: ['w0', 'w2'] },
  startWorld: 'w0',
};

describe('model validation', () => {
  it('accepts valid model', () => {
    const r = validateModel(validModel);
    expect(r.valid).toBe(true);
    expect(r.errors.length).toBe(0);
  });

  it('rejects empty worlds', () => {
    const r = validateModel({ worlds: [], edges: {}, valuation: {} });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('at least one world'))).toBe(true);
  });

  it('rejects invalid edge source', () => {
    const m: KripkeModel = { worlds: ['w0'], edges: { w1: ['w0'] }, valuation: {} };
    const r = validateModel(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('w1'))).toBe(true);
  });

  it('rejects invalid edge target', () => {
    const m: KripkeModel = { worlds: ['w0'], edges: { w0: ['w1'] }, valuation: {} };
    const r = validateModel(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('w1'))).toBe(true);
  });

  it('rejects invalid valuation reference', () => {
    const m: KripkeModel = { worlds: ['w0'], edges: {}, valuation: { p: ['w1'] } };
    const r = validateModel(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('w1'))).toBe(true);
  });

  it('rejects invalid start world', () => {
    const m: KripkeModel = { worlds: ['w0'], edges: {}, valuation: {}, startWorld: 'w9' };
    const r = validateModel(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('w9'))).toBe(true);
  });

  it('rejects exceeding world limit', () => {
    const m: KripkeModel = { worlds: ['w0', 'w1', 'w2'], edges: {}, valuation: {} };
    const r = validateModel(m, 2);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('limit'))).toBe(true);
  });

  it('warns about no edges', () => {
    const m: KripkeModel = { worlds: ['w0'], edges: {}, valuation: {} };
    const r = validateModel(m);
    expect(r.valid).toBe(true);
    expect(r.warnings.some(w => w.includes('no edges'))).toBe(true);
  });

  it('detects duplicate worlds', () => {
    const m: KripkeModel = { worlds: ['w0', 'w0'], edges: {}, valuation: {} };
    const r = validateModel(m);
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('duplicate'))).toBe(true);
  });
});

describe('getSuccessors', () => {
  it('returns successors', () => {
    expect(getSuccessors(validModel, 'w0')).toEqual(['w1', 'w2']);
  });
  it('returns empty for dead-end', () => {
    expect(getSuccessors(validModel, 'w2')).toEqual([]);
  });
});

describe('getAtomsAtWorld', () => {
  it('returns atoms at world', () => {
    expect(getAtomsAtWorld(validModel, 'w0')).toEqual(['p', 'q']);
  });
  it('returns empty if no atoms', () => {
    const m: KripkeModel = { worlds: ['w0'], edges: {}, valuation: {} };
    expect(getAtomsAtWorld(m, 'w0')).toEqual([]);
  });
});
