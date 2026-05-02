import { describe, it, expect } from 'vitest';
import {
  isReflexive, isSymmetric, isTransitive, isSerial, isEuclidean,
  isFunctional, isPartialFunctional, isEmpty, isDiscrete, isDense,
  isConvergent, isWellFounded,
  enforceReflexive, enforceSymmetric, enforceTransitive, enforceSerial, enforceEuclidean,
  checkConstraint, checkAllConstraints,
} from '../../src/backend/constraints';
import type { KripkeModel } from '../../src/backend/types';

const m: KripkeModel = {
  worlds: ['w0', 'w1', 'w2'],
  edges: { w0: ['w1'], w1: ['w2'] },
  valuation: {},
};

const reflexiveM: KripkeModel = {
  worlds: ['w0', 'w1'],
  edges: { w0: ['w0', 'w1'], w1: ['w1'] },
  valuation: {},
};

const symmetricM: KripkeModel = {
  worlds: ['w0', 'w1'],
  edges: { w0: ['w1'], w1: ['w0'] },
  valuation: {},
};

const emptyM: KripkeModel = { worlds: ['w0', 'w1'], edges: {}, valuation: {} };

describe('reflexive', () => {
  it('detects non-reflexive', () => expect(isReflexive(m)).toBe(false));
  it('detects reflexive', () => expect(isReflexive(reflexiveM)).toBe(true));
  it('enforces reflexivity', () => {
    const enforced = enforceReflexive(m);
    expect(isReflexive(enforced)).toBe(true);
  });
  it('enforcement is idempotent', () => {
    const e1 = enforceReflexive(m);
    const e2 = enforceReflexive(e1);
    expect(isReflexive(e2)).toBe(true);
  });
});

describe('symmetric', () => {
  it('detects non-symmetric', () => expect(isSymmetric(m)).toBe(false));
  it('detects symmetric', () => expect(isSymmetric(symmetricM)).toBe(true));
  it('enforces symmetry', () => {
    const enforced = enforceSymmetric(m);
    expect(isSymmetric(enforced)).toBe(true);
  });
});

describe('transitive', () => {
  it('detects non-transitive', () => expect(isTransitive(m)).toBe(false));
  it('enforces transitivity', () => {
    const enforced = enforceTransitive(m);
    expect(isTransitive(enforced)).toBe(true);
    expect(enforced.edges['w0']).toContain('w2');
  });
});

describe('serial', () => {
  it('detects non-serial (dead-end)', () => expect(isSerial(m)).toBe(false));
  it('detects serial', () => expect(isSerial(reflexiveM)).toBe(true));
  it('enforces seriality', () => {
    const enforced = enforceSerial(m);
    expect(isSerial(enforced)).toBe(true);
  });
});

describe('euclidean', () => {
  it('detects non-euclidean', () => {
    const m2: KripkeModel = {
      worlds: ['w0', 'w1', 'w2'],
      edges: { w0: ['w1', 'w2'] },
      valuation: {},
    };
    expect(isEuclidean(m2)).toBe(false);
  });
  it('enforces euclidean', () => {
    const m2: KripkeModel = {
      worlds: ['w0', 'w1', 'w2'],
      edges: { w0: ['w1', 'w2'] },
      valuation: {},
    };
    const enforced = enforceEuclidean(m2);
    expect(isEuclidean(enforced)).toBe(true);
  });
});

describe('functional', () => {
  it('detects functional', () => {
    const m2: KripkeModel = {
      worlds: ['w0', 'w1'],
      edges: { w0: ['w1'], w1: ['w0'] },
      valuation: {},
    };
    expect(isFunctional(m2)).toBe(true);
  });
  it('detects non-functional', () => expect(isFunctional(m)).toBe(false));
});

describe('partialFunctional', () => {
  it('detects partial functional', () => expect(isPartialFunctional(emptyM)).toBe(true));
  it('detects non-partial-functional', () => {
    const m2: KripkeModel = {
      worlds: ['w0'],
      edges: { w0: ['w0', 'w0'] },
      valuation: {},
    };
    // w0 has duplicate edges but this depends on implementation
    expect(isPartialFunctional(m2)).toBe(false);
  });
});

describe('empty', () => {
  it('detects empty', () => expect(isEmpty(emptyM)).toBe(true));
  it('detects non-empty', () => expect(isEmpty(m)).toBe(false));
});

describe('discrete', () => {
  it('detects non-discrete (has cross-world edges)', () => {
    expect(isDiscrete(reflexiveM)).toBe(false); // has w0->w1
  });
  it('detects discrete (empty model)', () => {
    expect(isDiscrete(emptyM)).toBe(true);
  });
  it('self-loop only is discrete', () => {
    const m2: KripkeModel = {
      worlds: ['w0'],
      edges: { w0: ['w0'] },
      valuation: {},
    };
    expect(isDiscrete(m2)).toBe(true);
  });
});

describe('dense', () => {
  it('detects dense (reflexive model)', () => {
    expect(isDense(reflexiveM)).toBe(true);
  });
  it('detects non-dense', () => {
    expect(isDense(m)).toBe(false);
  });
});

describe('convergent', () => {
  it('detects convergent', () => {
    const m2: KripkeModel = {
      worlds: ['w0', 'w1', 'w2', 'w3'],
      edges: { w0: ['w1', 'w2'], w1: ['w3'], w2: ['w3'], w3: ['w3'] },
      valuation: {},
    };
    expect(isConvergent(m2)).toBe(true);
  });
});

describe('wellFounded', () => {
  it('detects well-founded (acyclic)', () => expect(isWellFounded(m)).toBe(true));
  it('detects non-well-founded (cycle)', () => {
    const m2: KripkeModel = {
      worlds: ['w0', 'w1'],
      edges: { w0: ['w1'], w1: ['w0'] },
      valuation: {},
    };
    expect(isWellFounded(m2)).toBe(false);
  });
  it('self-loop is not well-founded', () => {
    expect(isWellFounded(reflexiveM)).toBe(false);
  });
});

describe('dispatch', () => {
  it('checkConstraint dispatches correctly', () => {
    expect(checkConstraint(emptyM, 'empty')).toBe(true);
    expect(checkConstraint(m, 'empty')).toBe(false);
  });
  it('checkAllConstraints returns results', () => {
    const results = checkAllConstraints(m, ['reflexive', 'transitive']);
    expect(results.length).toBe(2);
    expect(results[0].constraint).toBe('reflexive');
    expect(results[0].satisfied).toBe(false);
  });
});
