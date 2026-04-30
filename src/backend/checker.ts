/**
 * Model checker for modal logic over finite Kripke models.
 *
 * Algorithm (bottom-up approach):
 *   1. Collect all subformulas sorted by increasing structural size
 *   2. For each subformula, compute the truth set (set of worlds where it holds)
 *   3. Cache truth sets by canonical formula string
 *   4. Compute final result at the designated world
 */
import type {
  FormulaNode, KripkeModel, EvaluationResult,
  TruthSetEntry, WitnessInfo, CounterexampleInfo, TraceStep,
} from './types';
import { subformulas, formulaToString, prettyPrint } from './ast';
import { getSuccessors } from './model';

/**
 * Evaluate a formula at a given world in a Kripke model.
 * Uses truth-set computation.
 */
export function evaluate(
  formula: FormulaNode,
  model: KripkeModel,
  world: string
): EvaluationResult {
  const allSubs = subformulas(formula);
  const truthSetMap = new Map<string, Set<string>>();
  const truthSets: TruthSetEntry[] = [];
  const witnesses: WitnessInfo[] = [];
  const counterexamples: CounterexampleInfo[] = [];
  const trace: TraceStep[] = [];

  // Prrocess each subformula from smallest to largest
  for (const sub of allSubs) {
    const key = formulaToString(sub);
    if (truthSetMap.has(key)) continue; // already cached

    const truthSet = new Set<string>();
    let method = '';

    switch (sub.type) {
      case 'atom': {
        method = 'atom lookup';
        const atomWorlds = model.valuation[sub.name] ?? [];
        for (const w of atomWorlds) {
          if (model.worlds.includes(w)) truthSet.add(w);
        }
        break;
      }

      case 'not': {
        method = 'negation';
        const operandSet = truthSetMap.get(formulaToString(sub.operand))!;
        for (const w of model.worlds) {
          if (!operandSet.has(w)) truthSet.add(w);
        }
        break;
      }

      case 'and': {
        method = 'conjunction';
        const leftSet = truthSetMap.get(formulaToString(sub.left))!;
        const rightSet = truthSetMap.get(formulaToString(sub.right))!;
        for (const w of model.worlds) {
          if (leftSet.has(w) && rightSet.has(w)) truthSet.add(w);
        }
        break;
      }

      case 'or': {
        method = 'disjunction';
        const leftSet = truthSetMap.get(formulaToString(sub.left))!;
        const rightSet = truthSetMap.get(formulaToString(sub.right))!;
        for (const w of model.worlds) {
          if (leftSet.has(w) || rightSet.has(w)) truthSet.add(w);
        }
        break;
      }

      case 'implies': {
        method = 'implication';
        const leftSet = truthSetMap.get(formulaToString(sub.left))!;
        const rightSet = truthSetMap.get(formulaToString(sub.right))!;
        for (const w of model.worlds) {
          if (!leftSet.has(w) || rightSet.has(w)) truthSet.add(w);
        }
        break;
      }

      case 'box': {
        method = 'all successors';
        const operandSet = truthSetMap.get(formulaToString(sub.operand))!;
        for (const w of model.worlds) {
          const succs = getSuccessors(model, w);
          // Vacuously true if no successors
          const allSuccsSatisfy = succs.every(v => operandSet.has(v));
          if (allSuccsSatisfy) {
            truthSet.add(w);
          } else {
            // Record counterexamples
            const failing = succs.filter(v => !operandSet.has(v));
            if (failing.length > 0) {
              counterexamples.push({
                formula: prettyPrint(sub),
                world: w,
                counterexamples: failing,
              });
            }
          }
        }
        break;
      }

      case 'diamond': {
        method = 'exists successor';
        const operandSet = truthSetMap.get(formulaToString(sub.operand))!;
        for (const w of model.worlds) {
          const succs = getSuccessors(model, w);
          const witnessWorlds = succs.filter(v => operandSet.has(v));
          if (witnessWorlds.length > 0) {
            truthSet.add(w);
            witnesses.push({
              formula: prettyPrint(sub),
              world: w,
              witnesses: witnessWorlds,
            });
          }
        }
        break;
      }
    }

    truthSetMap.set(key, truthSet);
    truthSets.push({
      formula: prettyPrint(sub),
      worlds: Array.from(truthSet).sort(),
      method,
    });
  }

  // Compute result at the designated world
  const formulaKey = formulaToString(formula);
  const resultSet = truthSetMap.get(formulaKey)!;
  const result = resultSet.has(world);

  // Terace for the designated world
  for (const sub of allSubs) {
    const key = formulaToString(sub);
    const ts = truthSetMap.get(key)!;
    const holds = ts.has(world);
    let reason = '';

    switch (sub.type) {
      case 'atom':
        reason = holds ? `${sub.name} is in valuation at ${world}` : `${sub.name} is not in valuation at ${world}`;
        break;
      case 'not':
        reason = holds ? `operand is false at ${world}` : `operand is true at ${world}`;
        break;
      case 'and':
        reason = holds ? `both conjuncts true at ${world}` : `at least one conjunct false at ${world}`;
        break;
      case 'or':
        reason = holds ? `at least one disjunct true at ${world}` : `both disjuncts false at ${world}`;
        break;
      case 'implies':
        reason = holds ? `antecedent false or consequent true at ${world}` : `antecedent true but consequent false at ${world}`;
        break;
      case 'box': {
        const succs = getSuccessors(model, world);
        if (succs.length === 0) {
          reason = `vacuously true (no successors at ${world})`;
        } else {
          reason = holds
            ? `all ${succs.length} successor(s) satisfy the operand`
            : `some successor(s) fail the operand`;
        }
        break;
      }
      case 'diamond': {
        const succs = getSuccessors(model, world);
        if (succs.length === 0) {
          reason = `false (no successors at ${world})`;
        } else {
          reason = holds
            ? `found witness successor(s)`
            : `no successor satisfies the operand`;
        }
        break;
      }
    }

    trace.push({
      formula: prettyPrint(sub),
      world,
      result: holds,
      reason,
    });
  }

  return {
    result,
    world,
    formula: prettyPrint(formula),
    truthSets,
    witnesses: witnesses.filter(w => w.world === world),
    counterexamples: counterexamples.filter(c => c.world === world),
    trace,
  };
}
