/**
 * Formula normalization / equivalence rewriting.
 *
 * Applies rewrite rules bottom-up, iterating until a fixed point.
 * Each applied rule is recorded as a NormalizationStep.
 *
 * Rules:
 *   - Double negation:     ¬¬p  →  p
 *   - Box-Diamond duality: ¬◇¬p →  □p
 *   - Diamond-Box duality: ¬□¬p →  ◇p
 *   - De Morgan (and):     ¬(p ∧ q) → ¬p ∨ ¬q
 *   - De Morgan (or):      ¬(p ∨ q) → ¬p ∧ ¬q
 *   - Implication elim:    p → q    → ¬p ∨ q
 */
import type { FormulaNode, NormalizationResult, NormalizationStep } from './types';
import { prettyPrint, structuralEquals, formulaToString } from './ast';
import { not, and, or, diamond, box } from './ast';

// Apply one pass of rewrite rules bottom-up. Returns the rewritten tree and any steps.

function rewritePass(node: FormulaNode, steps: NormalizationStep[]): FormulaNode {
  // First, recursively normalize children
  let result: FormulaNode;

  switch (node.type) {
    case 'atom':
      result = node;
      break;
    case 'not':
      result = { type: 'not', operand: rewritePass(node.operand, steps) };
      break;
    case 'box':
      result = { type: 'box', operand: rewritePass(node.operand, steps) };
      break;
    case 'diamond':
      result = { type: 'diamond', operand: rewritePass(node.operand, steps) };
      break;
    case 'and':
      result = { type: 'and', left: rewritePass(node.left, steps), right: rewritePass(node.right, steps) };
      break;
    case 'or':
      result = { type: 'or', left: rewritePass(node.left, steps), right: rewritePass(node.right, steps) };
      break;
    case 'implies':
      result = { type: 'implies', left: rewritePass(node.left, steps), right: rewritePass(node.right, steps) };
      break;
  }

  // Now apply rules to the current node
  return applyRules(result, steps);
}

function applyRules(node: FormulaNode, steps: NormalizationStep[]): FormulaNode {
  const before = prettyPrint(node);

  // Rule: ¬¬φ → φ
  if (node.type === 'not' && node.operand.type === 'not') {
    const after = node.operand.operand;
    steps.push({ rule: 'Double negation elimination: ¬¬φ ≡ φ', before, after: prettyPrint(after) });
    return after;
  }

  // Rule: ¬□φ → ◇¬φ
  if (node.type === 'not' && node.operand.type === 'box') {
    const after = diamond(not(node.operand.operand));
    steps.push({ rule: 'Push negation inward: ¬□φ ≡ ◇¬φ', before, after: prettyPrint(after) });
    return after;
  }

  // Rule: ¬◇φ → □¬φ
  if (node.type === 'not' && node.operand.type === 'diamond') {
    const after = box(not(node.operand.operand));
    steps.push({ rule: 'Push negation inward: ¬◇φ ≡ □¬φ', before, after: prettyPrint(after) });
    return after;
  }

  // Rule: De Morgan (and): ¬(φ ∧ ψ) → ¬φ ∨ ¬ψ
  if (node.type === 'not' && node.operand.type === 'and') {
    const after = or(not(node.operand.left), not(node.operand.right));
    steps.push({ rule: 'De Morgan: ¬(φ ∧ ψ) ≡ ¬φ ∨ ¬ψ', before, after: prettyPrint(after) });
    return after;
  }

  // Rule: De Morgan (or): ¬(φ ∨ ψ) → ¬φ ∧ ¬ψ
  if (node.type === 'not' && node.operand.type === 'or') {
    const after = and(not(node.operand.left), not(node.operand.right));
    steps.push({ rule: 'De Morgan: ¬(φ ∨ ψ) ≡ ¬φ ∧ ¬ψ', before, after: prettyPrint(after) });
    return after;
  }

  // Rule: Implication elimination: φ → ψ → ¬φ ∨ ψ
  if (node.type === 'implies') {
    const after = or(not(node.left), node.right);
    steps.push({ rule: 'Implication elimination: φ → ψ ≡ ¬φ ∨ ψ', before, after: prettyPrint(after) });
    return after;
  }

  return node;
}

// Normalize a formula by repeatedly applying rewrite rules until fixed point.
export function normalize(formula: FormulaNode): NormalizationResult {
  let current = formula;
  const allSteps: NormalizationStep[] = [];
  const MAX_ITERATIONS = 100;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const steps: NormalizationStep[] = [];
    const next = rewritePass(current, steps);

    if (steps.length === 0) break; // Fixed point reached

    allSteps.push(...steps);
    current = next;
  }

  return {
    original: formula,
    normalized: current,
    steps: allSteps,
    changed: !structuralEquals(formula, current),
  };
}

// Check if two formulas are equivalent under normalization.
export function areEquivalent(a: FormulaNode, b: FormulaNode): boolean {
  const na = normalize(a).normalized;
  const nb = normalize(b).normalized;
  return formulaToString(na) === formulaToString(nb);
}
