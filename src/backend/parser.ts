/**
 * Recursive descent parser for modal logic formulae.
 *
 * Operator precedence (lowest to highest):
 *   1. →  (right-associative)
 *   2. ∨  (left-associative)
 *   3. ∧  (left-associative)
 *   4. ¬, □, ◇  (prefix)
 *   5. atoms, parenthesized subexpressions
 */
import type { FormulaNode, Token, TokenType, CheckLimits } from './types';
import { tokenize } from './lexer';
import { atom, not, and, or, implies, box, diamond, extractAtoms, formulaDepth } from './ast';

export class ParseError extends Error {
  constructor(message: string, public readonly position: number) {
    super(message);
    this.name = 'ParseError';
  }
}

class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private eat(type: TokenType): Token {
    const tok = this.current();
    if (tok.type !== type) {
      throw new ParseError(
        `Expected ${type} but got ${tok.type} ('${tok.value}') at position ${tok.position}`,
        tok.position
      );
    }
    this.pos++;
    return tok;
  }

  private match(type: TokenType): boolean {
    return this.current().type === type;
  }

  parseFormula(): FormulaNode {
    const result = this.parseImplies();
    if (!this.match('EOF') && !this.match('RPAREN')) {
      const tok = this.current();
      throw new ParseError(
        `Unexpected token '${tok.value}' at position ${tok.position}`,
        tok.position
      );
    }
    return result;
  }

  private parseImplies(): FormulaNode {
    let left = this.parseDisjunct();
    if (this.match('IMPLIES')) {
      this.eat('IMPLIES');
      const right = this.parseImplies();
      left = implies(left, right);
    }
    return left;
  }

  private parseDisjunct(): FormulaNode {
    let left = this.parseConjunct();
    while (this.match('OR')) {
      this.eat('OR');
      const right = this.parseConjunct();
      left = or(left, right);
    }
    return left;
  }

  private parseConjunct(): FormulaNode {
    let left = this.parseUnary();
    while (this.match('AND')) {
      this.eat('AND');
      const right = this.parseUnary();
      left = and(left, right);
    }
    return left;
  }

  private parseUnary(): FormulaNode {
    if (this.match('NOT')) { this.eat('NOT'); return not(this.parseUnary()); }
    if (this.match('BOX')) { this.eat('BOX'); return box(this.parseUnary()); }
    if (this.match('DIAMOND')) { this.eat('DIAMOND'); return diamond(this.parseUnary()); }
    return this.parsePrimary();
  }

  private parsePrimary(): FormulaNode {
    if (this.match('ATOM')) {
      const tok = this.eat('ATOM');
      return atom(tok.value);
    }
    if (this.match('LPAREN')) {
      this.eat('LPAREN');
      const expr = this.parseImplies();
      this.eat('RPAREN');
      return expr;
    }
    const tok = this.current();
    throw new ParseError(
      `Unexpected token '${tok.value}' at position ${tok.position}. Expected atom or '('.`,
      tok.position
    );
  }
}

export function parse(input: string, limits?: CheckLimits): FormulaNode {
  if (!input.trim()) {
    throw new ParseError('Empty formula', 0);
  }
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  const ast = parser.parseFormula();

  if (limits?.maxAtoms !== undefined) {
    const atoms = extractAtoms(ast);
    if (atoms.length > limits.maxAtoms) {
      throw new ParseError(`Formula uses ${atoms.length} atoms, limit is ${limits.maxAtoms}`, 0);
    }
  }
  if (limits?.maxFormulaDepth !== undefined) {
    const depth = formulaDepth(ast);
    if (depth > limits.maxFormulaDepth) {
      throw new ParseError(`Formula depth is ${depth}, limit is ${limits.maxFormulaDepth}`, 0);
    }
  }
  return ast;
}
