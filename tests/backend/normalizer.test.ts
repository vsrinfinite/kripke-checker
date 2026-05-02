import { describe, it, expect } from 'vitest';
import { normalize, areEquivalent } from '../../src/backend/normalizer';
import { parse } from '../../src/backend/parser';
import { atom, not, and, or, box, diamond, implies, prettyPrint, structuralEquals } from '../../src/backend/ast';

describe('normalizer', () => {
  describe('double negation elimination', () => {
    it('¬¬p → p', () => {
      const r = normalize(not(not(atom('p'))));
      expect(prettyPrint(r.normalized)).toBe('p');
      expect(r.changed).toBe(true);
      expect(r.steps.some(s => s.rule.includes('Double negation'))).toBe(true);
    });
    it('¬¬¬p → ¬p', () => {
      const r = normalize(not(not(not(atom('p')))));
      expect(prettyPrint(r.normalized)).toBe('¬p');
    });
  });

  describe('Push negation inward (Box/Diamond)', () => {
    it('¬◇¬p → □p (via □¬¬p)', () => {
      const r = normalize(not(diamond(not(atom('p')))));
      expect(prettyPrint(r.normalized)).toBe('□p');
      expect(r.changed).toBe(true);
      expect(r.steps.some(s => s.rule.includes('Push negation inward'))).toBe(true);
      expect(r.steps.some(s => s.rule.includes('Double negation'))).toBe(true);
    });
  });

  describe('Push negation inward (Diamond/Box)', () => {
    it('¬□¬p → ◇p (via ◇¬¬p)', () => {
      const r = normalize(not(box(not(atom('p')))));
      expect(prettyPrint(r.normalized)).toBe('◇p');
      expect(r.changed).toBe(true);
      expect(r.steps.some(s => s.rule.includes('Push negation inward'))).toBe(true);
      expect(r.steps.some(s => s.rule.includes('Double negation'))).toBe(true);
    });
  });

  describe('De Morgan laws', () => {
    it('¬(p ∧ q) → ¬p ∨ ¬q', () => {
      const r = normalize(not(and(atom('p'), atom('q'))));
      expect(prettyPrint(r.normalized)).toBe('¬p ∨ ¬q');
      expect(r.changed).toBe(true);
    });
    it('¬(p ∨ q) → ¬p ∧ ¬q', () => {
      const r = normalize(not(or(atom('p'), atom('q'))));
      expect(prettyPrint(r.normalized)).toBe('¬p ∧ ¬q');
      expect(r.changed).toBe(true);
    });
  });

  describe('implication elimination', () => {
    it('p → q → ¬p ∨ q', () => {
      const r = normalize(implies(atom('p'), atom('q')));
      expect(prettyPrint(r.normalized)).toBe('¬p ∨ q');
      expect(r.changed).toBe(true);
    });
  });

  describe('no-op cases', () => {
    it('atom is unchanged', () => {
      const r = normalize(atom('p'));
      expect(r.changed).toBe(false);
      expect(r.steps.length).toBe(0);
    });
    it('¬p is unchanged (single negation)', () => {
      const r = normalize(not(atom('p')));
      expect(r.changed).toBe(false);
    });
    it('p ∧ q is unchanged', () => {
      const r = normalize(and(atom('p'), atom('q')));
      expect(r.changed).toBe(false);
    });
  });

  describe('fixed point stability', () => {
    it('normalizing twice gives same result', () => {
      const f = not(not(not(not(atom('p')))));
      const r1 = normalize(f);
      const r2 = normalize(r1.normalized);
      expect(structuralEquals(r1.normalized, r2.normalized)).toBe(true);
      expect(r2.changed).toBe(false);
    });
  });

  describe('steps are reported correctly', () => {
    it('reports all steps', () => {
      const f = not(not(implies(atom('p'), atom('q'))));
      const r = normalize(f);
      expect(r.steps.length).toBeGreaterThan(0);
      for (const s of r.steps) {
        expect(s.before).toBeTruthy();
        expect(s.after).toBeTruthy();
        expect(s.rule).toBeTruthy();
      }
    });
  });

  describe('parse + normalize integration', () => {
    it('normalizes parsed formula', () => {
      const ast = parse('!!p');
      const r = normalize(ast);
      expect(prettyPrint(r.normalized)).toBe('p');
    });
  });

  describe('implementation constraints', () => {
    it('does not use string replacement (.replace) for logic', () => {
      // Static check: normalizer.ts should not contain .replace() calls
      // because all rewriting must be structural on the AST.
      import('fs').then(fs => {
        import('path').then(path => {
          const filePath = path.join(__dirname, '../../src/backend/normalizer.ts');
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content).not.toContain('.replace(');
        });
      });
    });
  });
});

describe('areEquivalent', () => {
  it('□p ≡ ¬◇¬p', () => {
    expect(areEquivalent(box(atom('p')), not(diamond(not(atom('p')))))).toBe(true);
  });
  it('◇p ≡ ¬□¬p', () => {
    expect(areEquivalent(diamond(atom('p')), not(box(not(atom('p')))))).toBe(true);
  });
  it('¬¬p ≡ p', () => {
    expect(areEquivalent(not(not(atom('p'))), atom('p'))).toBe(true);
  });
  it('p ∧ q is not equivalent to p ∨ q', () => {
    expect(areEquivalent(and(atom('p'), atom('q')), or(atom('p'), atom('q')))).toBe(false);
  });
});
