/**
 * Central Frame Registry
 *
 * This module defines all supported named modal frame systems and their constraints.
 *
 * Currently supported systems (v1):
 *   K, T, K4, KD, KB, S4, S5, KD45
 *
 * The architecture is extensible, and new named systems may be added.
 */
import type { LogicPreset, FrameConstraint, NamedFrameDefinition } from './types';

export const FRAME_REGISTRY: readonly NamedFrameDefinition[] = [
  { name: 'K', constraints: [], description: 'Minimal normal modal logic' },
  { name: 'T', constraints: ['reflexive'], description: 'Reflexive frames' },
  { name: 'K4', constraints: ['transitive'], description: 'Transitive frames' },
  { name: 'KD', constraints: ['serial'], description: 'Serial frames' },
  { name: 'KB', constraints: ['symmetric'], description: 'Symmetric frames' },
  { name: 'S4', constraints: ['reflexive', 'transitive'], description: 'Reflexive + transitive frames' },
  { name: 'S5', constraints: ['reflexive', 'euclidean'], description: 'Reflexive + Euclidean frames' },
  { name: 'KD45', constraints: ['serial', 'transitive', 'euclidean'], description: 'Belief logic frames' },
] as const;

/** Return the full frame registry. */
export function getFrameRegistry(): readonly NamedFrameDefinition[] {
  return FRAME_REGISTRY;
}

/*Look up a named frame definition by its preset name.*/
export function getNamedFrame(name: LogicPreset): NamedFrameDefinition | undefined {
  return FRAME_REGISTRY.find(f => f.name === name);
}

/*Detect whether a set of constraints exactly matches a named system:

- Comparison is unordered (set equality).
- Only exact matches are returned — supersets and subsets are rejected.
- Returns the matching NamedFrameDefinition, or null if no match.*/
export function detectMatchingPreset(constraints: FrameConstraint[]): NamedFrameDefinition | null {
  const inputSorted = [...constraints].sort();

  for (const def of FRAME_REGISTRY) {
    const defSorted = [...def.constraints].sort();
    if (
      inputSorted.length === defSorted.length &&
      inputSorted.every((c, i) => c === defSorted[i])
    ) {
      return def;
    }
  }

  return null;
}

/** Resolve a preset name to its frame constraints. */
export function resolvePreset(name: LogicPreset): FrameConstraint[] {
  const def = getNamedFrame(name);
  return def ? [...def.constraints] : [];
}
