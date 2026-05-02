import { describe, it, expect } from 'vitest';
import { asciiToUnicode, unicodeToAscii, normalizeInput, toAsciiDisplay, getAliasTable } from '../../src/backend/symbolMap';

describe('symbolMap', () => {
  describe('asciiToUnicode', () => {
    it('converts ! to ¬', () => { expect(asciiToUnicode('!')).toBe('¬'); });
    it('converts ~ to ¬', () => { expect(asciiToUnicode('~')).toBe('¬'); });
    it('converts & to ∧', () => { expect(asciiToUnicode('&')).toBe('∧'); });
    it('converts ^ to ∧', () => { expect(asciiToUnicode('^')).toBe('∧'); });
    it('converts | to ∨', () => { expect(asciiToUnicode('|')).toBe('∨'); });
    it('converts /\\ to ∧', () => { expect(asciiToUnicode('/\\')).toBe('∧'); });
    it('converts \\/ to ∨', () => { expect(asciiToUnicode('\\/')).toBe('∨'); });
    it('converts -> to →', () => { expect(asciiToUnicode('->')).toBe('→'); });
    it('converts [] to □', () => { expect(asciiToUnicode('[]')).toBe('□'); });
    it('converts <> to ◇', () => { expect(asciiToUnicode('<>')).toBe('◇'); });
    it('returns unknown input unchanged', () => { expect(asciiToUnicode('x')).toBe('x'); });
  });

  describe('unicodeToAscii', () => {
    it('converts ¬ to !', () => { expect(unicodeToAscii('¬')).toBe('!'); });
    it('converts ∧ to &', () => { expect(unicodeToAscii('∧')).toBe('&'); });
    it('converts ∨ to |', () => { expect(unicodeToAscii('∨')).toBe('|'); });
    it('converts → to ->', () => { expect(unicodeToAscii('→')).toBe('->'); });
    it('converts □ to []', () => { expect(unicodeToAscii('□')).toBe('[]'); });
    it('converts ◇ to <>', () => { expect(unicodeToAscii('◇')).toBe('<>'); });
    it('returns unknown input unchanged', () => { expect(unicodeToAscii('p')).toBe('p'); });
  });

  describe('normalizeInput', () => {
    it('normalizes mixed ASCII formula', () => {
      expect(normalizeInput('[](p -> <>q) /\\ r')).toBe('□(p → ◇q) ∧ r');
    });
    it('normalizes !p & q', () => {
      expect(normalizeInput('!p & q')).toBe('¬p ∧ q');
    });
    it('normalizes p | q', () => {
      expect(normalizeInput('p | q')).toBe('p ∨ q');
    });
    it('preserves already-Unicode input', () => {
      expect(normalizeInput('□(p → ◇q)')).toBe('□(p → ◇q)');
    });
    it('handles multi-char aliases before single-char', () => {
      expect(normalizeInput('/\\')).toBe('∧');
      expect(normalizeInput('\\/')).toBe('∨');
    });
    it('does not treat lowercase v as OR', () => {
      // v is a valid atom, not an alias for ∨
      expect(normalizeInput('v')).toBe('v');
    });
    it('normalizes ~p', () => {
      expect(normalizeInput('~p')).toBe('¬p');
    });
    it('normalizes ^ as conjunction', () => {
      expect(normalizeInput('p ^ q')).toBe('p ∧ q');
    });
  });

  describe('toAsciiDisplay', () => {
    it('converts Unicode formula to ASCII', () => {
      expect(toAsciiDisplay('□(p → ◇q) ∧ r')).toBe('[](p -> <>q) & r');
    });
  });

  describe('getAliasTable', () => {
    it('returns alias entries', () => {
      const table = getAliasTable();
      expect(table.length).toBeGreaterThan(0);
      expect(table[0]).toHaveProperty('ascii');
      expect(table[0]).toHaveProperty('unicode');
      expect(table[0]).toHaveProperty('description');
    });
  });

  describe('round-trip', () => {
    it('ASCII → Unicode → ASCII preserves meaning', () => {
      const ascii = '!p & q | r -> []s';
      const unicode = normalizeInput(ascii);
      const back = toAsciiDisplay(unicode);
      expect(back).toBe('!p & q | r -> []s');
    });
  });
});
