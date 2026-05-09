import { useState, useCallback, useEffect } from 'react';
import type { LogicProfile, LogicPreset, FrameConstraint, SavedProfile, NamedFrameDefinition } from '@backend/types';
import { PRESET_DEFINITIONS, detectConflicts, resolveProfile } from '@backend/logicProfile';
import { detectMatchingPreset } from '@backend/frameRegistry';

const STORAGE_KEY = 'kripke-checker-profiles';

export function useLogicProfile() {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [preset, setPreset] = useState<LogicPreset>('K');
  const [constraints, setConstraints] = useState<FrameConstraint[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

  // Load saved profiles from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedProfiles(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const profile: LogicProfile = {
    mode,
    preset: mode === 'preset' ? preset : null,
    constraints: mode === 'preset' ? (PRESET_DEFINITIONS[preset] ?? []) : constraints,
  };

  const resolvedConstraints = resolveProfile(profile);
  const conflicts = detectConflicts(resolvedConstraints);

  // Full match detection from the central registry
  const matchedDefinition: NamedFrameDefinition | null =
    mode === 'custom' ? detectMatchingPreset(constraints) : null;
  const matchedPreset: LogicPreset | null =
    mode === 'custom' ? (matchedDefinition?.name ?? null) : preset;

  const selectPreset = useCallback((p: LogicPreset) => {
    setMode('preset');
    setPreset(p);
    setConstraints(PRESET_DEFINITIONS[p] ?? []);
  }, []);

  const toggleConstraint = useCallback((c: FrameConstraint) => {
    setMode('custom');
    setConstraints(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
  }, []);

  const saveProfile = useCallback((name: string) => {
    const newProfile: SavedProfile = { name, constraints: [...constraints] };
    const updated = [...savedProfiles.filter(p => p.name !== name), newProfile];
    setSavedProfiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [constraints, savedProfiles]);

  const loadProfile = useCallback((saved: SavedProfile) => {
    setMode('custom');
    setConstraints([...saved.constraints]);
  }, []);

  const deleteProfile = useCallback((name: string) => {
    const updated = savedProfiles.filter(p => p.name !== name);
    setSavedProfiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [savedProfiles]);

  return {
    mode, preset, constraints, profile,
    resolvedConstraints, conflicts,
    matchedPreset, matchedDefinition,
    savedProfiles,
    selectPreset, toggleConstraint,
    saveProfile, loadProfile, deleteProfile,
    setMode,
  };
}
