import type { CheckRequest, CheckResult, LogicProfile } from './types';
import { parse, ParseError } from './parser';
import { normalize } from './normalizer';
import { validateModel } from './model';
import { checkAllConstraints, enforceAllConstraints } from './constraints';
import { resolveProfile, detectConflicts } from './logicProfile';
import { evaluate } from './checker';
import { modelToDot } from './dot';
import { prettyPrint } from './ast';

const DEFAULT_PROFILE: LogicProfile = { mode: 'preset', preset: 'K', constraints: [] };

// Run the full model-checking pipeline.
export function checkFormula(request: CheckRequest): CheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. Parse formula
  let ast;
  try {
    ast = parse(request.formula, request.limits);
  } catch (e) {
    if (e instanceof ParseError) {
      return { success: false, warnings, errors: [e.message] };
    }
    return { success: false, warnings, errors: [`Parse error: ${(e as Error).message}`] };
  }

  // 2. Normalize formula
  const normResult = normalize(ast);
  if (normResult.changed) {
    warnings.push(`Formula was normalized: ${prettyPrint(normResult.original)} → ${prettyPrint(normResult.normalized)}`);
  }

  // 3. Validate model
  const validation = validateModel(request.model, request.limits?.maxWorlds);
  if (!validation.valid) {
    return { success: false, normalization: normResult, warnings: validation.warnings, errors: validation.errors };
  }
  warnings.push(...validation.warnings);

  // 4. Resolve logic profile
  const profile = request.logicProfile ?? DEFAULT_PROFILE;
  const constraints = resolveProfile(profile);

  // 5. Detect conflicts
  const conflicts = detectConflicts(constraints);
  if (conflicts.length > 0) {
    warnings.push(...conflicts.map(c => `Constraint conflict: ${c.message}`));
  }

  // 6. Check constraints on model
  let modelUsed = request.model;
  const constraintResults = checkAllConstraints(modelUsed, constraints);
  const failing = constraintResults.filter(r => !r.satisfied);

  if (failing.length > 0 && request.autoRepair) {
    // Auto-repair only if explicitly requested
    modelUsed = enforceAllConstraints(modelUsed, constraints);
    warnings.push(`Auto-repair applied for: ${failing.map(f => f.constraint).join(', ')}`);
  } else if (failing.length > 0) {
    for (const f of failing) {
      warnings.push(`Model does not satisfy: ${f.constraint}`);
    }
  }

  // 7. Determine start world
  const startWorld = request.startWorld ?? modelUsed.startWorld ?? modelUsed.worlds[0];
  if (!modelUsed.worlds.includes(startWorld)) {
    return {
      success: false,
      normalization: normResult,
      constraintResults,
      conflicts,
      warnings,
      errors: [`Start world '${startWorld}' not found in model`],
    };
  }

  // 8. Evaluate (use original AST, not normalized, for semantic fidelity)
  const evaluation = evaluate(ast, modelUsed, startWorld);

  // 9. Generate DOT
  const dot = modelToDot(modelUsed, {
    startWorld,
    highlightWorlds: evaluation.witnesses.flatMap(w => w.witnesses),
  });

  return {
    success: true,
    evaluation,
    normalization: normResult,
    constraintResults,
    conflicts,
    dot,
    modelUsed,
    warnings,
    errors,
  };
}
