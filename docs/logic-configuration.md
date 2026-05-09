# Logic Configuration

Beyond standard presets, the model checker allows fully custom frame constraint selection.

## Constraint Categories

### Core Constraints
| Constraint | Definition |
|-----------|-----------|
| Reflexive | $\forall w: wRw$ |
| Symmetric | $\forall w \forall v: wRv \to vRw$ |
| Transitive | $\forall w \forall v \forall u: (wRv \wedge vRu) \to wRu$ |
| Serial | $\forall w \exists v: wRv$ |
| Euclidean | $\forall w \forall v \forall u: (wRv \wedge wRu) \to vRu$ |

### Structural Constraints
| Constraint | Definition |
|-----------|-----------|
| Functional | $\forall w \exists! v: wRv$ (exactly one successor) |
| Partial Functional | $\forall w: \lvert\{v : wRv\}\rvert \leq 1$ |
| Empty | $\forall w: \neg\exists v: wRv$ (no edges at all) |
| Discrete | Only self-loops allowed |
| Dense | $\forall w \forall v: wRv \to \exists u(wRu \wedge uRv)$ |

### Advanced Constraints
| Constraint | Definition |
|-----------|-----------|
| Convergent | $\forall w \forall v \forall u: (wRv \wedge wRu) \to \exists x(vRx \wedge uRx)$ |
| Well-Founded | No infinite descending chains (finite approx: acyclicity) |

## Conflict Detection

Certain constraint combinations are impossible to satisfy simultaneously:

| Combination | Reason |
|------------|--------|
| empty + serial | Empty means no successors, serial requires at least one |
| empty + reflexive | Empty means no edges, reflexivity requires self-loops |
| empty + functional | Empty means no successors, functional requires exactly one |
| wellFounded + serial | In finite models, acyclicity requires dead-ends, serial forbids them |
| wellFounded + reflexive | Self-loops are cycles |

The backend detects these conflicts and the frontend displays them prominently.

## Auto-Repair

> [!WARNING]
> Auto-repair is **optional and off by default**. The model is **never silently mutated**. The user must explicitly enable auto-repair via the checkbox.

When enabled, auto-repair modifies the model's accessibility relation to satisfy the selected constraints:
- Reflexive: adds self-loops
- Symmetric: adds reverse edges
- Transitive: computes transitive closure
- Serial: adds self-loops to dead-end worlds
- Euclidean: adds edges to satisfy the Euclidean property

## Custom Profiles

Users can save and load custom constraint combinations using the profile system:
1. Select constraints in custom mode
2. Enter a profile name and click Save
3. Load saved profiles from the list
4. Profiles are stored in `localStorage`
