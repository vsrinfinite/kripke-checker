# Backend API Reference

The core logic engine is a standalone TypeScript library that can be consumed directly.

## Entry Point

```typescript
import { checkFormula } from './src/backend/service';
import type { CheckRequest, CheckResult } from './src/backend/types';
```

## `checkFormula(request: CheckRequest): CheckResult`

The main pipeline function. Runs the full model-checking pipeline:

1. Parse the formula (with ASCII normalization)
2. Normalize the AST using rewrite rules
3. Validate the Kripke model
4. Resolve the logic profile (preset or custom)
5. Detect constraint conflicts
6. Check constraints on the model
7. Optionally repair the model (only if `autoRepair: true`)
8. Evaluate the formula bottom-up
9. Generate DOT output for visualization

### CheckRequest

```typescript
interface CheckRequest {
  formula: string;                // Formula string (ASCII or Unicode)
  model: KripkeModel;            // The Kripke model
  startWorld?: string;           // World to evaluate at (default: first world)
  logicProfile?: LogicProfile;   // Preset or custom constraints
  limits?: CheckLimits;          // Max atoms, worlds, depth
  autoRepair?: boolean;          // Whether to auto-repair (default: false)
}
```

### CheckResult

```typescript
interface CheckResult {
  success: boolean;
  evaluation?: EvaluationResult;          // Truth value, truth sets, witnesses, trace
  normalization?: NormalizationResult;    // Normalization steps
  constraintResults?: ConstraintCheckResult[];  // Per-constraint check
  conflicts?: ConflictError[];            // Detected conflicts
  dot?: string;                           // DOT graph string
  modelUsed?: KripkeModel;               // Model after optional repair
  warnings: string[];
  errors: string[];
}
```

## Individual Modules

### Parser
```typescript
import { parse } from './src/backend/parser';
const ast = parse('□(p → ◇q)');      // Unicode
const ast2 = parse('[](p -> <>q)');    // ASCII (auto-normalized)
```

Parses a formula string into an AST. Supports both Unicode (`□`, `◇`, `¬`, `∧`, `∨`, `→`) and ASCII equivalents.

### Normalizer
```typescript
import { normalize, areEquivalent } from './src/backend/normalizer';
const result = normalize(ast);  // { original, normalized, steps, changed }
areEquivalent(ast1, ast2);      // boolean
```

Applies rewrite rules: double negation elimination ($\neg\neg p \Rightarrow p$), De Morgan, modal duality ($\neg\Diamond\neg p \Rightarrow \Box p$), implication elimination ($p \to q \Rightarrow \neg p \vee q$).

### Model Checker
```typescript
import { evaluate } from './src/backend/checker';
const result = evaluate(ast, model, 'w0');
// result.result: boolean
// result.truthSets: TruthSetEntry[]
// result.witnesses: WitnessInfo[]
// result.counterexamples: CounterexampleInfo[]
// result.trace: TraceStep[]
```

### DOT Generator
```typescript
import { modelToDot } from './src/backend/dot';
const dot = modelToDot(model, {
  startWorld: 'w0',
  highlightWorlds: ['w1'],
  title: 'My Model',
  atomFilter: ['p', 'q'],   // Optional: formula-aware mode
});
```

The `atomFilter` option restricts which atoms appear in node labels. When omitted, all atoms from the model valuation are shown (full model mode).

### Constraints
```typescript
import { checkConstraint, enforceConstraint, checkAllConstraints } from './src/backend/constraints';
const isSatisfied = checkConstraint(model, 'reflexive');
const repaired = enforceConstraint(model, 'reflexive');
```

### Logic Profile
```typescript
import { resolveProfile, detectConflicts, matchPreset } from './src/backend/logicProfile';
const constraints = resolveProfile(profile);
const conflicts = detectConflicts(constraints);
const preset = matchPreset(['reflexive', 'transitive']); // 'S4'
```

### Frame Registry
```typescript
import { getFrameRegistry, getNamedFrame, detectMatchingPreset, resolvePreset } from './src/backend/frameRegistry';
const registry = getFrameRegistry();         // All named systems
const s5 = getNamedFrame('S5');              // { name, constraints, description }
const match = detectMatchingPreset(['reflexive', 'euclidean']); // S5 definition
const constraints = resolvePreset('KD45');   // ['serial', 'transitive', 'euclidean']
```

### Graph Utilities
```typescript
import { extractAtomSet } from './src/backend/ast';
import { filterValuationByAtoms } from './src/backend/graphUtils';
const atoms = extractAtomSet(ast);                                // Set<string>
const filtered = filterValuationByAtoms(model.valuation, atoms);  // filtered valuation
```
