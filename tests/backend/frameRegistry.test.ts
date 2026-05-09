import { describe, it, expect } from 'vitest';
import {
  FRAME_REGISTRY,
  getFrameRegistry,
  getNamedFrame,
  detectMatchingPreset,
  resolvePreset,
} from '../../src/backend/frameRegistry';
import { PRESET_DEFINITIONS, matchPreset } from '../../src/backend/logicProfile';
import type { FrameConstraint } from '../../src/backend/types';

// All valid constraint names (from the FrameConstraint union type)
const VALID_CONSTRAINTS: FrameConstraint[] = [
  'reflexive', 'symmetric', 'transitive', 'serial', 'euclidean',
  'functional', 'partialFunctional', 'empty', 'discrete', 'dense',
  'convergent', 'wellFounded',
];

describe('frameRegistry', () => {
  describe('registry completeness', () => {
    it('contains exactly 8 named systems', () => {
      expect(FRAME_REGISTRY.length).toBe(8);
    });

    it('contains all expected named systems', () => {
      const names = FRAME_REGISTRY.map(f => f.name);
      expect(names).toEqual(['K', 'T', 'K4', 'KD', 'KB', 'S4', 'S5', 'KD45']);
    });

    it('has unique names — no duplicates', () => {
      const names = FRAME_REGISTRY.map(f => f.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('every entry has a non-empty description', () => {
      for (const def of FRAME_REGISTRY) {
        expect(def.description.length).toBeGreaterThan(0);
      }
    });

    it('every constraint in the registry is a valid FrameConstraint', () => {
      for (const def of FRAME_REGISTRY) {
        for (const c of def.constraints) {
          expect(VALID_CONSTRAINTS).toContain(c);
        }
      }
    });
  });

  describe('derived PRESET_DEFINITIONS', () => {
    it('PRESET_DEFINITIONS matches registry exactly', () => {
      for (const def of FRAME_REGISTRY) {
        expect(PRESET_DEFINITIONS[def.name]).toEqual(def.constraints);
      }
    });

    it('PRESET_DEFINITIONS has same number of entries as registry', () => {
      expect(Object.keys(PRESET_DEFINITIONS).length).toBe(FRAME_REGISTRY.length);
    });
  });

  describe('getFrameRegistry', () => {
    it('returns the full registry', () => {
      const reg = getFrameRegistry();
      expect(reg).toEqual(FRAME_REGISTRY);
    });
  });

  describe('getNamedFrame', () => {
    it('returns correct definition for S4', () => {
      const def = getNamedFrame('S4');
      expect(def).toBeDefined();
      expect(def!.constraints).toEqual(['reflexive', 'transitive']);
      expect(def!.description).toBe('Reflexive + transitive frames');
    });

    it('returns correct definition for K', () => {
      const def = getNamedFrame('K');
      expect(def).toBeDefined();
      expect(def!.constraints).toEqual([]);
    });

    it('returns correct definition for KD45', () => {
      const def = getNamedFrame('KD45');
      expect(def).toBeDefined();
      expect(def!.constraints).toEqual(['serial', 'transitive', 'euclidean']);
    });
  });

  describe('detectMatchingPreset', () => {
    it('detects S4 from reflexive + transitive', () => {
      const match = detectMatchingPreset(['reflexive', 'transitive']);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('S4');
    });

    it('detects S4 regardless of order (transitive, reflexive)', () => {
      const match = detectMatchingPreset(['transitive', 'reflexive']);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('S4');
    });

    it('detects K from empty constraints', () => {
      const match = detectMatchingPreset([]);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('K');
    });

    it('detects T from reflexive alone', () => {
      const match = detectMatchingPreset(['reflexive']);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('T');
    });

    it('detects S5 from reflexive + euclidean', () => {
      const match = detectMatchingPreset(['euclidean', 'reflexive']);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('S5');
    });

    it('returns null for non-matching combination', () => {
      const match = detectMatchingPreset(['reflexive', 'serial']);
      expect(match).toBeNull();
    });

    it('rejects supersets — no partial matching', () => {
      const match = detectMatchingPreset(['reflexive', 'transitive', 'euclidean']);
      expect(match).toBeNull();
    });

    it('rejects subsets of named systems', () => {
      // KD45 = [serial, transitive, euclidean]; just serial + transitive is not KD45
      const match = detectMatchingPreset(['serial', 'transitive']);
      expect(match).toBeNull();
    });

    it('includes description in matched result', () => {
      const match = detectMatchingPreset(['serial', 'transitive', 'euclidean']);
      expect(match).not.toBeNull();
      expect(match!.description).toBe('Belief logic frames');
    });
  });

  describe('resolvePreset', () => {
    it('resolves S4 to reflexive + transitive', () => {
      expect(resolvePreset('S4')).toEqual(['reflexive', 'transitive']);
    });

    it('resolves K to empty constraints', () => {
      expect(resolvePreset('K')).toEqual([]);
    });

    it('resolves KD45 to serial + transitive + euclidean', () => {
      expect(resolvePreset('KD45')).toEqual(['serial', 'transitive', 'euclidean']);
    });
  });

  describe('matchPreset (logicProfile delegate)', () => {
    it('delegates to registry correctly', () => {
      expect(matchPreset(['reflexive', 'transitive'])).toBe('S4');
      expect(matchPreset(['reflexive', 'serial'])).toBeNull();
    });
  });
});
