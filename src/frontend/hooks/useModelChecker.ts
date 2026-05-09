import { useState, useCallback, useMemo } from 'react';
import type { CheckResult, KripkeModel, LogicProfile } from '@backend/types';
import { checkFormula } from '@backend/service';
import { parse } from '@backend/parser';
import { extractAtomSet } from '@backend/ast';

const DEFAULT_MODEL: KripkeModel = {
  worlds: ['w0', 'w1', 'w2', 'w3', 'w4'],
  edges: {
    w0: ['w1', 'w4'],
    w1: ['w2', 'w3'],
    w2: ['w4'],
    w3: ['w4'],
  },
  valuation: {
    p: ['w0', 'w1', 'w4'],
    q: ['w0', 'w2', 'w4'],
  },
  startWorld: 'w0',
};

export function useModelChecker() {
  const [formula, setFormula] = useState('□(p → ◇q)');
  const [modelJson, setModelJson] = useState(JSON.stringify(DEFAULT_MODEL, null, 2));
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRepair, setAutoRepair] = useState(false);

  // Compute formula atoms reactively for formula-aware graph mode.
  // Safe parse: returns empty set on invalid formulas.
  const formulaAtoms = useMemo<Set<string>>(() => {
    try {
      const ast = parse(formula);
      return extractAtomSet(ast);
    } catch {
      return new Set<string>();
    }
  }, [formula]);

  const runCheck = useCallback((profile: LogicProfile) => {
    setError(null);
    try {
      const model: KripkeModel = JSON.parse(modelJson);
      const startWorld = model.startWorld ?? model.worlds[0];
      const r = checkFormula({
        formula,
        model,
        startWorld,
        logicProfile: profile,
        autoRepair,
      });
      setResult(r);
      if (!r.success) {
        setError(r.errors.join('; '));
      }
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  }, [formula, modelJson, autoRepair]);

  return {
    formula, setFormula,
    modelJson, setModelJson,
    result, error,
    autoRepair, setAutoRepair,
    runCheck,
    formulaAtoms,
    defaultModelJson: JSON.stringify(DEFAULT_MODEL, null, 2),
  };
}
