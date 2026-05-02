import { describe, it, expect } from 'vitest';
import { PRESET_DEFINITIONS, detectConflicts, resolveProfile, matchPreset, CONSTRAINT_CATEGORIES } from '../../src/backend/logicProfile';
import type { LogicProfile } from '../../src/backend/types';

describe('logicProfile', () => {
  describe('presets', () => {
    it('K has no constraints', () => expect(PRESET_DEFINITIONS['K']).toEqual([]));
    it('T has reflexive', () => expect(PRESET_DEFINITIONS['T']).toEqual(['reflexive']));
    it('K4 has transitive', () => expect(PRESET_DEFINITIONS['K4']).toEqual(['transitive']));
    it('KD has serial', () => expect(PRESET_DEFINITIONS['KD']).toEqual(['serial']));
    it('KB has symmetric', () => expect(PRESET_DEFINITIONS['KB']).toEqual(['symmetric']));
    it('S4 has reflexive + transitive', () => expect(PRESET_DEFINITIONS['S4']).toEqual(['reflexive', 'transitive']));
    it('S5 has reflexive + euclidean', () => expect(PRESET_DEFINITIONS['S5']).toEqual(['reflexive', 'euclidean']));
    it('KD45 has serial + transitive + euclidean', () => {
      expect(PRESET_DEFINITIONS['KD45']).toEqual(['serial', 'transitive', 'euclidean']);
    });
  });

  describe('conflict detection', () => {
    it('detects empty + serial conflict', () => {
      const c = detectConflicts(['empty', 'serial']);
      expect(c.length).toBeGreaterThan(0);
      expect(c[0].message).toBeTruthy();
    });
    it('detects empty + reflexive conflict', () => {
      const c = detectConflicts(['empty', 'reflexive']);
      expect(c.length).toBeGreaterThan(0);
    });
    it('detects empty + functional conflict', () => {
      const c = detectConflicts(['empty', 'functional']);
      expect(c.length).toBeGreaterThan(0);
    });
    it('detects wellFounded + reflexive conflict', () => {
      const c = detectConflicts(['wellFounded', 'reflexive']);
      expect(c.length).toBeGreaterThan(0);
    });
    it('no conflicts for valid combos', () => {
      const c = detectConflicts(['reflexive', 'transitive']);
      expect(c.length).toBe(0);
    });
  });

  describe('resolveProfile', () => {
    it('resolves preset mode', () => {
      const p: LogicProfile = { mode: 'preset', preset: 'S4', constraints: [] };
      expect(resolveProfile(p)).toEqual(['reflexive', 'transitive']);
    });
    it('resolves custom mode', () => {
      const p: LogicProfile = { mode: 'custom', preset: null, constraints: ['serial', 'euclidean'] };
      expect(resolveProfile(p)).toEqual(['serial', 'euclidean']);
    });
  });

  describe('matchPreset', () => {
    it('matches S4', () => expect(matchPreset(['reflexive', 'transitive'])).toBe('S4'));
    it('matches K (empty)', () => expect(matchPreset([])).toBe('K'));
    it('matches S5', () => expect(matchPreset(['reflexive', 'euclidean'])).toBe('S5'));
    it('returns null for non-preset', () => expect(matchPreset(['reflexive', 'serial'])).toBeNull());
    it('order independent', () => expect(matchPreset(['transitive', 'reflexive'])).toBe('S4'));
  });

  describe('constraint categories', () => {
    it('has 3 categories', () => expect(CONSTRAINT_CATEGORIES.length).toBe(3));
    it('core has 5 constraints', () => {
      const core = CONSTRAINT_CATEGORIES.find(c => c.name === 'Core');
      expect(core?.constraints.length).toBe(5);
    });
  });
});
