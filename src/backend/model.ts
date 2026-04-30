import type { KripkeModel, ValidationResult } from './types';

// Validate a Kripke model for structural correctness.
export function validateModel(model: KripkeModel, maxWorlds?: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const worldSet = new Set(model.worlds);

  if (model.worlds.length === 0) {
    errors.push('Model must have at least one world');
  }

  // Check for duplicate worlds
  if (worldSet.size !== model.worlds.length) {
    errors.push('Model contains duplicate world names');
  }

  // World limit
  if (maxWorlds !== undefined && model.worlds.length > maxWorlds) {
    errors.push(`Model has ${model.worlds.length} worlds, but the limit is ${maxWorlds}`);
  }

  // Validate edges
  for (const [src, targets] of Object.entries(model.edges)) {
    if (!worldSet.has(src)) {
      errors.push(`Edge source '${src}' is not a known world`);
    }
    for (const tgt of targets) {
      if (!worldSet.has(tgt)) {
        errors.push(`Edge target '${tgt}' (from '${src}') is not a known world`);
      }
    }
  }

  // Validate valuations
  for (const [atomName, worlds] of Object.entries(model.valuation)) {
    for (const w of worlds) {
      if (!worldSet.has(w)) {
        errors.push(`Valuation for '${atomName}' references unknown world '${w}'`);
      }
    }
  }

  // Validate start world
  if (model.startWorld !== undefined && !worldSet.has(model.startWorld)) {
    errors.push(`Start world '${model.startWorld}' is not a known world`);
  }

  // Warnings for potentially odd models
  if (model.worlds.length > 0 && Object.keys(model.edges).length === 0) {
    warnings.push('Model has no edges (all worlds are dead-ends)');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// Get the successors of a world in the model.
export function getSuccessors(model: KripkeModel, world: string): string[] {
  return model.edges[world] ?? [];
}

// Get the atoms true at a given world.
export function getAtomsAtWorld(model: KripkeModel, world: string): string[] {
  const atoms: string[] = [];
  for (const [atomName, worlds] of Object.entries(model.valuation)) {
    if (worlds.includes(world)) {
      atoms.push(atomName);
    }
  }
  return atoms.sort();
}
