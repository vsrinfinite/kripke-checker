/**
 * AST construction, inspection, and utility functions for mformulae.
 */
import type {
  FormulaNode, AtomNode, NotNode, AndNode, OrNode,
  ImpliesNode, BoxNode, DiamondNode,
} from './types';

// Factory functions

export function atom(name: string): AtomNode {
  return { type: 'atom', name };
}

export function not(operand: FormulaNode): NotNode {
  return { type: 'not', operand };
}

export function and(left: FormulaNode, right: FormulaNode): AndNode {
  return { type: 'and', left, right };
}

export function or(left: FormulaNode, right: FormulaNode): OrNode {
  return { type: 'or', left, right };
}

export function implies(left: FormulaNode, right: FormulaNode): ImpliesNode {
  return { type: 'implies', left, right };
}

export function box(operand: FormulaNode): BoxNode {
  return { type: 'box', operand };
}

export function diamond(operand: FormulaNode): DiamondNode {
  return { type: 'diamond', operand };
}

// Operator Precedence (for parenthesization)

function precedence(node: FormulaNode): number {
  switch (node.type) {
    case 'implies': return 1;
    case 'or': return 2;
    case 'and': return 3;
    case 'not': case 'box': case 'diamond': return 4;
    case 'atom': return 5;
  }
}

// Pretty Printing

/**
 * Pretty-print a formula AST to a human-readable Unicode string.
 * Uses minimal parentheses based on operator precedence.
 */
export function prettyPrint(node: FormulaNode): string {
  switch (node.type) {
    case 'atom':
      return node.name;
    case 'not':
      return '¬' + wrapIfNeeded(node.operand, node);
    case 'box':
      return '□' + wrapIfNeeded(node.operand, node);
    case 'diamond':
      return '◇' + wrapIfNeeded(node.operand, node);
    case 'and':
      return wrapBinary(node.left, node, 'left') + ' ∧ ' + wrapBinary(node.right, node, 'right');
    case 'or':
      return wrapBinary(node.left, node, 'left') + ' ∨ ' + wrapBinary(node.right, node, 'right');
    case 'implies':
      return wrapBinary(node.left, node, 'left') + ' → ' + wrapBinary(node.right, node, 'right');
  }
}

function wrapIfNeeded(child: FormulaNode, parent: FormulaNode): string {
  const pp = prettyPrint(child);
  if (precedence(child) < precedence(parent)) {
    return '(' + pp + ')';
  }
  return pp;
}

function wrapBinary(child: FormulaNode, parent: FormulaNode, side: 'left' | 'right'): string {
  const pp = prettyPrint(child);
  const cp = precedence(child);
  const parentP = precedence(parent);

  if (cp < parentP) return '(' + pp + ')';
  // Same-precedence: wrap right child of left-assoc, or left child of right-assoc.
  if (cp === parentP) {
    if (parent.type === 'implies' && side === 'left' && child.type === 'implies') return '(' + pp + ')';
    if (parent.type !== 'implies' && side === 'right' && child.type === parent.type) return pp;
  }
  return pp;
}

// Formula Size

/**
 * Compute the structural size of a formula (number of nodes in the AST).
 */
export function formulaSize(node: FormulaNode): number {
  switch (node.type) {
    case 'atom': return 1;
    case 'not': case 'box': case 'diamond':
      return 1 + formulaSize(node.operand);
    case 'and': case 'or': case 'implies':
      return 1 + formulaSize(node.left) + formulaSize(node.right);
  }
}

/**
 * Compute the depth of a formula (longest path from root to leaf).
 */
export function formulaDepth(node: FormulaNode): number {
  switch (node.type) {
    case 'atom': return 0;
    case 'not': case 'box': case 'diamond':
      return 1 + formulaDepth(node.operand);
    case 'and': case 'or': case 'implies':
      return 1 + Math.max(formulaDepth(node.left), formulaDepth(node.right));
  }
}

// Subformula Extraction

/**
 * Extract all subformulas, sorted by increasing structural size.
 * Use canonical string form to deduplicate.
 */
export function subformulas(node: FormulaNode): FormulaNode[] {
  const seen = new Map<string, FormulaNode>();

  function collect(n: FormulaNode): void {
    const key = formulaToString(n);
    if (seen.has(key)) return;
    switch (n.type) {
      case 'atom': break;
      case 'not': case 'box': case 'diamond':
        collect(n.operand); break;
      case 'and': case 'or': case 'implies':
        collect(n.left); collect(n.right); break;
    }
    seen.set(key, n);
  }

  collect(node);
  return Array.from(seen.values()).sort((a, b) => formulaSize(a) - formulaSize(b));
}

/**
 * Extract atomic propositions used in the formula.
 */
export function extractAtoms(node: FormulaNode): string[] {
  const atoms = new Set<string>();

  function collect(n: FormulaNode): void {
    switch (n.type) {
      case 'atom':
        atoms.add(n.name); break;
      case 'not': case 'box': case 'diamond':
        collect(n.operand); break;
      case 'and': case 'or': case 'implies':
        collect(n.left); collect(n.right); break;
    }
  }

  collect(node);
  return Array.from(atoms).sort();
}

// Structural Equality

/**
 * Check if two formula ASTs are structurally identical.
 */
export function structuralEquals(a: FormulaNode, b: FormulaNode): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'atom':
      return a.name === (b as AtomNode).name;
    case 'not': case 'box': case 'diamond':
      return structuralEquals(a.operand, (b as typeof a).operand);
    case 'and': case 'or': case 'implies':
      return structuralEquals(a.left, (b as typeof a).left) &&
        structuralEquals(a.right, (b as typeof a).right);
  }
}

// Clone

/**
 * Clone a formula AST.
 */
export function clone(node: FormulaNode): FormulaNode {
  switch (node.type) {
    case 'atom': return atom(node.name);
    case 'not': return not(clone(node.operand));
    case 'and': return and(clone(node.left), clone(node.right));
    case 'or': return or(clone(node.left), clone(node.right));
    case 'implies': return implies(clone(node.left), clone(node.right));
    case 'box': return box(clone(node.operand));
    case 'diamond': return diamond(clone(node.operand));
  }
}

// Canonical Stringification

/**
 * Stable canonical string representation of a formula.
 * To be used for caching, deduplication, and comparison.
 * This is a fully-parenthesized S-expression form.
 */
export function formulaToString(node: FormulaNode): string {
  switch (node.type) {
    case 'atom': return node.name;
    case 'not': return `(¬ ${formulaToString(node.operand)})`;
    case 'box': return `(□ ${formulaToString(node.operand)})`;
    case 'diamond': return `(◇ ${formulaToString(node.operand)})`;
    case 'and': return `(${formulaToString(node.left)} ∧ ${formulaToString(node.right)})`;
    case 'or': return `(${formulaToString(node.left)} ∨ ${formulaToString(node.right)})`;
    case 'implies': return `(${formulaToString(node.left)} → ${formulaToString(node.right)})`;
  }
}
