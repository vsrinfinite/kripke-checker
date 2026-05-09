import { describe, it, expect } from 'vitest';
import { tokenize } from '../../src/backend/lexer';
import { parse } from '../../src/backend/parser';
import { normalizeInput } from '../../src/backend/symbolMap';
import { normalize } from '../../src/backend/normalizer';
import { evaluate } from '../../src/backend/checker';
import { prettyPrint } from '../../src/backend/ast';

describe('End-to-End Pipeline Trace', () => {
  it('correctly executes full pipeline for [](p -> <>q)', () => {
    const input = '[](p -> <>q)';

    // 1. Normalization (string)
    const normalizedString = normalizeInput(input);
    expect(normalizedString).toBe('□(p → ◇q)');

    // 2. Tokenization
    const tokens = tokenize(input);
    expect(tokens.map(t => t.type)).toEqual(['BOX', 'LPAREN', 'ATOM', 'IMPLIES', 'DIAMOND', 'ATOM', 'RPAREN', 'EOF']);

    // 3. Parsing
    const ast = parse(input);
    expect(ast.type).toBe('box');
    if (ast.type === 'box') {
      expect(ast.operand.type).toBe('implies');
    }

    // 4. AST Normalization
    const normResult = normalize(ast);
    expect(prettyPrint(normResult.normalized)).toBe('□(¬p ∨ ◇q)');

    // 5. Evaluation
    const mockModel = {
      worlds: ['w0', 'w1'],
      edges: { w0: ['w1'], w1: [] },
      valuation: { p: ['w1'], q: ['w1'] },
      startWorld: 'w0'
    };

    const evalResult = evaluate(normResult.normalized, mockModel, 'w0');
    expect(evalResult.result).toBe(false);

    // Verify truth sets exist for all subformulas
    const formulas = evalResult.truthSets.map(ts => ts.formula);
    expect(formulas).toContain('p');
    expect(formulas).toContain('q');
    expect(formulas).toContain('¬p');
    expect(formulas).toContain('◇q');
    expect(formulas).toContain('¬p ∨ ◇q');
    expect(formulas).toContain('□(¬p ∨ ◇q)');
  });
});
