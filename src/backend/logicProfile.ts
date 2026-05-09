/**
 * Logic profile system: presets, custom constraint mode, conflict detection.
 *
 * PRESET_DEFINITIONS is derived from the central FRAME_REGISTRY.
 * Do NOT maintain preset definitions manually here.
 */
import type { LogicPreset, LogicProfile, FrameConstraint, ConflictError } from './types';
import { getFrameRegistry, detectMatchingPreset } from './frameRegistry';

// Derived from the central FRAME_REGISTRY — NOT a separate source of truth.
export const PRESET_DEFINITIONS: Record<LogicPreset, FrameConstraint[]> =
  Object.fromEntries(
    getFrameRegistry().map(f => [f.name, [...f.constraints]])
  ) as Record<LogicPreset, FrameConstraint[]>;

// Conflict Detection

const CONFLICT_PAIRS: { a: FrameConstraint; b: FrameConstraint; msg: string }[] = [
  { a: 'empty', b: 'serial', msg: 'An empty frame has no successors, but seriality requires at least one successor per world' },
  { a: 'empty', b: 'reflexive', msg: 'An empty frame has no edges, but reflexivity requires self-loops' },
  { a: 'empty', b: 'functional', msg: 'An empty frame has no successors, but functionality requires exactly one successor per world' },
  { a: 'empty', b: 'dense', msg: 'An empty frame trivially satisfies density, but combined with serial it is contradictory' },
  { a: 'functional', b: 'empty', msg: 'Functionality requires exactly one successor, but empty requires none' },
  { a: 'wellFounded', b: 'serial', msg: 'Well-foundedness (acyclicity) conflicts with seriality in finite models (serial requires successors, but acyclic finite graphs must have dead-ends)' },
  { a: 'wellFounded', b: 'reflexive', msg: 'Well-foundedness (acyclicity) conflicts with reflexivity (self-loops are cycles)' },
];

export function detectConflicts(constraints: FrameConstraint[]): ConflictError[] {
  const set = new Set(constraints);
  const conflicts: ConflictError[] = [];

  for (const { a, b, msg } of CONFLICT_PAIRS) {
    if (set.has(a) && set.has(b)) {
      conflicts.push({ constraints: [a, b], message: msg });
    }
  }

  return conflicts;
}

// Profile Resolution

export function resolveProfile(profile: LogicProfile): FrameConstraint[] {
  if (profile.mode === 'preset' && profile.preset) {
    return PRESET_DEFINITIONS[profile.preset] ?? [];
  }
  return profile.constraints;
}

// Preset Matching — delegates to the central registry

export function matchPreset(constraints: FrameConstraint[]): LogicPreset | null {
  const match = detectMatchingPreset(constraints);
  return match ? match.name : null;
}

// Constraint Categories 

export const CONSTRAINT_CATEGORIES: { name: string; constraints: FrameConstraint[] }[] = [
  { name: 'Core', constraints: ['reflexive', 'symmetric', 'transitive', 'serial', 'euclidean'] },
  { name: 'Structural', constraints: ['functional', 'partialFunctional', 'empty', 'discrete', 'dense'] },
  { name: 'Advanced', constraints: ['convergent', 'wellFounded'] },
];
