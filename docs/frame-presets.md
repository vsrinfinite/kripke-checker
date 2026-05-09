# Frame Presets

The model checker supports predefined configurations corresponding to standard normal modal logics.

| Preset | Axiom | Frame Constraints | Description |
|--------|-------|------------------|-------------|
| K | K | *(none)* | Minimal normal modal logic |
| T | $\Box p \to p$ | reflexive | Every world sees itself |
| K4 | $\Box p \to \Box\Box p$ | transitive | Accessibility is transitive |
| KD | $\Box p \to \Diamond p$ | serial | Every world has at least one successor |
| KB | $p \to \Box\Diamond p$ | symmetric | If $w$ sees $v$, then $v$ sees $w$ |
| S4 | T + 4 | reflexive, transitive | Preorder on worlds |
| S5 | T + 5 | reflexive, euclidean | Equivalence relation on worlds |
| KD45 | D + 4 + 5 | serial, transitive, euclidean | Doxastic logic (belief) |

## S5 Note

> [!IMPORTANT]
> S5 is implemented as reflexive + euclidean. This is equivalent to the common characterization as an equivalence relation (reflexive + symmetric + transitive), since reflexive + euclidean implies symmetry and transitivity. The euclidean formulation is preferred as it is more direct.

## Usage

In preset mode, selecting a preset automatically configures the corresponding frame constraints. The model is then validated against those constraints.

In custom mode, you can start from any preset and modify it by toggling individual constraints.

## Preset Expansion

Presets are defined in the central frame registry (`src/backend/frameRegistry.ts`):

```typescript
K:    []                            // no constraints
T:    ['reflexive']
K4:   ['transitive']
KD:   ['serial']
KB:   ['symmetric']
S4:   ['reflexive', 'transitive']
S5:   ['reflexive', 'euclidean']
KD45: ['serial', 'transitive', 'euclidean']
```
