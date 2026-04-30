/**
 * Frame constraint checking and optional enforcement for Kripke models.
 *
 * Check functions return boolean.
 * Enforce functions return a NEW model with the constraint satisfied.
 * Invoked when explicitly requested.
 */
import type { KripkeModel, FrameConstraint } from './types';

// Helpers
function successors(model: KripkeModel, w: string): string[] {
  return model.edges[w] ?? [];
}

function cloneEdges(model: KripkeModel): Record<string, string[]> {
  const edges: Record<string, string[]> = {};
  for (const w of model.worlds) {
    edges[w] = [...(model.edges[w] ?? [])];
  }
  return edges;
}

function addEdge(edges: Record<string, string[]>, from: string, to: string): void {
  if (!edges[from]) edges[from] = [];
  if (!edges[from].includes(to)) edges[from].push(to);
}

// Reflexive
export function isReflexive(model: KripkeModel): boolean {
  return model.worlds.every(w => successors(model, w).includes(w));
}

export function enforceReflexive(model: KripkeModel): KripkeModel {
  const edges = cloneEdges(model);
  for (const w of model.worlds) addEdge(edges, w, w);
  return { ...model, edges };
}

// Symmetric

export function isSymmetric(model: KripkeModel): boolean {
  for (const w of model.worlds) {
    for (const v of successors(model, w)) {
      if (!successors(model, v).includes(w)) return false;
    }
  }
  return true;
}

export function enforceSymmetric(model: KripkeModel): KripkeModel {
  const edges = cloneEdges(model);
  for (const w of model.worlds) {
    for (const v of (model.edges[w] ?? [])) {
      addEdge(edges, v, w);
    }
  }
  return { ...model, edges };
}

// Transitive

export function isTransitive(model: KripkeModel): boolean {
  for (const w of model.worlds) {
    for (const v of successors(model, w)) {
      for (const u of successors(model, v)) {
        if (!successors(model, w).includes(u)) return false;
      }
    }
  }
  return true;
}

export function enforceTransitive(model: KripkeModel): KripkeModel {
  const edges = cloneEdges(model);
  let changed = true;
  while (changed) {
    changed = false;
    for (const w of model.worlds) {
      for (const v of [...(edges[w] ?? [])]) {
        for (const u of [...(edges[v] ?? [])]) {
          if (!edges[w]?.includes(u)) {
            addEdge(edges, w, u);
            changed = true;
          }
        }
      }
    }
  }
  return { ...model, edges };
}

// Serial

export function isSerial(model: KripkeModel): boolean {
  return model.worlds.every(w => successors(model, w).length > 0);
}

export function enforceSerial(model: KripkeModel): KripkeModel {
  const edges = cloneEdges(model);
  for (const w of model.worlds) {
    if ((edges[w] ?? []).length === 0) {
      addEdge(edges, w, w); // self-loop as minimal fix
    }
  }
  return { ...model, edges };
}

// Euclidean

export function isEuclidean(model: KripkeModel): boolean {
  for (const w of model.worlds) {
    const succs = successors(model, w);
    for (const v of succs) {
      for (const u of succs) {
        if (!successors(model, v).includes(u)) return false;
      }
    }
  }
  return true;
}

export function enforceEuclidean(model: KripkeModel): KripkeModel {
  const edges = cloneEdges(model);
  let changed = true;
  while (changed) {
    changed = false;
    for (const w of model.worlds) {
      const succs = edges[w] ?? [];
      for (const v of succs) {
        for (const u of succs) {
          if (!edges[v]?.includes(u)) {
            addEdge(edges, v, u);
            changed = true;
          }
        }
      }
    }
  }
  return { ...model, edges };
}

// Functional

export function isFunctional(model: KripkeModel): boolean {
  return model.worlds.every(w => successors(model, w).length === 1);
}

// Partial Functional 

export function isPartialFunctional(model: KripkeModel): boolean {
  return model.worlds.every(w => successors(model, w).length <= 1);
}

// Empty 

export function isEmpty(model: KripkeModel): boolean {
  return model.worlds.every(w => successors(model, w).length === 0);
}

// Discrete

export function isDiscrete(model: KripkeModel): boolean {
  // Discrete: only self-loops allowed
  for (const w of model.worlds) {
    for (const v of successors(model, w)) {
      if (v !== w) return false;
    }
  }
  return true;
}

// Dense

export function isDense(model: KripkeModel): boolean {
  // Dense: ∀w∀v(wRv → ∃u(wRu ∧ uRv))
  for (const w of model.worlds) {
    for (const v of successors(model, w)) {
      const hasIntermediate = successors(model, w).some(u => successors(model, u).includes(v));
      if (!hasIntermediate) return false;
    }
  }
  return true;
}

// Convergent

export function isConvergent(model: KripkeModel): boolean {
  // Convergent: ∀w∀v∀u((wRv ∧ wRu) → ∃x(vRx ∧ uRx))
  for (const w of model.worlds) {
    const succs = successors(model, w);
    for (const v of succs) {
      for (const u of succs) {
        const vSuccs = successors(model, v);
        const uSuccs = successors(model, u);
        const hasCommon = vSuccs.some(x => uSuccs.includes(x));
        if (!hasCommon) return false;
      }
    }
  }
  return true;
}

// Well-Founded 

export function isWellFounded(model: KripkeModel): boolean {
  // Finite approximation: no infinite descending chains (no cycles reachable).
  // In a finite model, well-foundedness ≡ acyclicity of the strict accessibility relation.
  const visited = new Set<string>();
  const stack = new Set<string>();

  function hasCycle(w: string): boolean {
    if (stack.has(w)) return true;
    if (visited.has(w)) return false;
    visited.add(w);
    stack.add(w);
    for (const v of successors(model, w)) {
      if (v !== w && hasCycle(v)) return true; // exclude self-loops for strict part
    }
    stack.delete(w);
    return false;
  }

  // Check for self-loops first
  for (const w of model.worlds) {
    if (successors(model, w).includes(w)) return false;
  }

  for (const w of model.worlds) {
    if (hasCycle(w)) return false;
  }
  return true;
}

// Dispatch

const CHECKERS: Record<FrameConstraint, (m: KripkeModel) => boolean> = {
  reflexive: isReflexive,
  symmetric: isSymmetric,
  transitive: isTransitive,
  serial: isSerial,
  euclidean: isEuclidean,
  functional: isFunctional,
  partialFunctional: isPartialFunctional,
  empty: isEmpty,
  discrete: isDiscrete,
  dense: isDense,
  convergent: isConvergent,
  wellFounded: isWellFounded,
};

type Enforcer = (m: KripkeModel) => KripkeModel;

const ENFORCERS: Partial<Record<FrameConstraint, Enforcer>> = {
  reflexive: enforceReflexive,
  symmetric: enforceSymmetric,
  transitive: enforceTransitive,
  serial: enforceSerial,
  euclidean: enforceEuclidean,
};

export function checkConstraint(model: KripkeModel, constraint: FrameConstraint): boolean {
  return CHECKERS[constraint](model);
}

export function enforceConstraint(model: KripkeModel, constraint: FrameConstraint): KripkeModel | null {
  const enforcer = ENFORCERS[constraint];
  if (!enforcer) return null;
  return enforcer(model);
}

export function checkAllConstraints(model: KripkeModel, constraints: FrameConstraint[]) {
  return constraints.map(c => ({ constraint: c, satisfied: checkConstraint(model, c) }));
}

export function enforceAllConstraints(model: KripkeModel, constraints: FrameConstraint[]): KripkeModel {
  let current = model;
  for (const c of constraints) {
    const enforcer = ENFORCERS[c];
    if (enforcer) current = enforcer(current);
  }
  return current;
}
