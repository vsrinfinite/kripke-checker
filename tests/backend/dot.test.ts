import { describe, it, expect } from 'vitest';
import { modelToDot } from '../../src/backend/dot';
import type { KripkeModel } from '../../src/backend/types';

const testModel: KripkeModel = {
  worlds: ['w0', 'w1', 'w2'],
  edges: { w0: ['w1', 'w0'], w1: ['w2'] },
  valuation: { p: ['w0', 'w1'], q: ['w2'] },
  startWorld: 'w0',
};

describe('dot', () => {
  it('generates valid DOT structure', () => {
    const dot = modelToDot(testModel);
    expect(dot).toContain('digraph KripkeModel');
    expect(dot).toContain('{');
    expect(dot).toContain('}');
  });

  it('includes all nodes', () => {
    const dot = modelToDot(testModel);
    expect(dot).toContain('"w0"');
    expect(dot).toContain('"w1"');
    expect(dot).toContain('"w2"');
  });

  it('includes edges', () => {
    const dot = modelToDot(testModel);
    expect(dot).toContain('"w0" -> "w1"');
    expect(dot).toContain('"w1" -> "w2"');
  });

  it('includes self-loops', () => {
    const dot = modelToDot(testModel);
    expect(dot).toContain('"w0" -> "w0"');
  });

  it('highlights start world', () => {
    const dot = modelToDot(testModel, { startWorld: 'w0' });
    expect(dot).toContain('penwidth=3');
  });

  it('includes atom labels', () => {
    const dot = modelToDot(testModel);
    expect(dot).toContain('p');
    expect(dot).toContain('q');
  });

  it('highlights specified worlds', () => {
    const dot = modelToDot(testModel, { highlightWorlds: ['w1'] });
    expect(dot).toContain('#16a34a');
  });

  it('highlights specified edges', () => {
    const dot = modelToDot(testModel, { highlightEdges: [['w0', 'w1']] });
    expect(dot).toContain('#dc2626');
  });

  it('includes title', () => {
    const dot = modelToDot(testModel, { title: 'Test Model' });
    expect(dot).toContain('Test Model');
  });

  it('handles empty model', () => {
    const empty: KripkeModel = { worlds: ['w0'], edges: {}, valuation: {} };
    const dot = modelToDot(empty);
    expect(dot).toContain('"w0"');
  });
});
