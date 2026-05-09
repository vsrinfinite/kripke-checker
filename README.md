# Modal Logic Model Checker

A robust, test-driven modal logic model checker for finite Kripke models. This tool supports parsing, normalization, and bottom-up model checking with configurable frame constraints, along with a functional React frontend for interactive exploration.

## Quick Start

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Run the test suite
npm test

# Type-check the project
npm run check

# Build for production
npm run build
```

Then open `http://localhost:5173` in your browser.

## Features

- **Formula Input**: Type formulas using keyboard-friendly ASCII (`[](p -> <>q)`) or Unicode (`□(p → ◇q)`)
- **Live Preview**: Real-time parsing and normalization feedback as you type
- **Formula Normalization**: Automatic simplification using logical equivalences (double negation, De Morgan, duality)
- **Bottom-Up Evaluation**: Computes truth sets for all subformulas across all worlds
- **Kripke Graph Visualization**: Interactive DOT/Graphviz rendering via WebAssembly
  - **Full Model Mode**: Shows all atoms in the model valuation
  - **Formula-Aware Mode**: Shows only atoms from the current formula AST
- **Configurable Logic**: 8 standard presets (K, T, K4, KD, KB, S4, S5, KD45) + fully custom constraint selection
- **Central Frame Registry**: Single source of truth for all named frame systems
- **Custom Mode Detection**: Automatically identifies when custom constraints match a named system
- **Conflict Detection**: Warns about impossible constraint combinations
- **Witnesses & Counterexamples**: Shows which successors satisfy or fail modal operators
- **Explanation Traces**: Step-by-step reasoning for each subformula
- **Subformula Truth Table**: Complete truth values across all worlds
- **DOT Export**: Export Kripke models for LaTeX/Graphviz workflows
- **Custom Profile Saving**: Save and load constraint configurations

## How to Enter Formulas

The system accepts ASCII aliases that are normalized to Unicode:

| Type | Displayed | LaTeX |
|------|-----------|-------|
| `!p` or `~p` | `¬p` | $\neg p$ |
| `p & q` or `p ^ q` or `p /\ q` | `p ∧ q` | $p \wedge q$ |
| `p \| q` or `p \/ q` | `p ∨ q` | $p \vee q$ |
| `p -> q` | `p → q` | $p \to q$ |
| `[]p` | `□p` | $\Box p$ |
| `<>p` | `◇p` | $\Diamond p$ |

You can also click the connective buttons in the UI.

## How Presets Work

Each preset maps to a set of frame constraints:
- **K**: No constraints (minimal modal logic)
- **T**: Reflexive ($\Box p \to p$)
- **S4**: Reflexive + Transitive ($\Box p \to p$, $\Box p \to \Box\Box p$)
- **S5**: Reflexive + Euclidean (equivalence relation)
- **KD45**: Serial + Transitive + Euclidean (belief logic)

Switch to **Custom mode** to select arbitrary combinations of constraints from three categories: Core, Structural, and Advanced.

When your custom selection exactly matches a named system, a banner will indicate the match.

## Graph Display Modes

The Kripke model graph supports two display modes:

- **Full Model** (default): Shows all atoms present in the model valuation, which is mathematically faithful
- **Formula-Aware**: Shows only atoms that appear in the current formula's AST, reducing visual clutter for demos

> [!NOTE]
> Display modes only affect graph labels. The underlying model used for evaluation is never altered.

## How to Read the Result Panel

After clicking **Run Check**:
1. **Status**: TRUE/FALSE at the selected world
2. **Warnings**: Normalization info, constraint violations
3. **Explanation**: Step-by-step trace showing how each subformula was evaluated
4. **Witnesses**: For $\Diamond$ formulas, which successor(s) satisfy the operand
5. **Counterexamples**: For $\Box$ failures, which successor(s) violate the operand
6. **Constraint Results**: Whether each selected constraint is satisfied

## Architecture

The project is a monorepo with a pure TypeScript backend library consumed directly by the React frontend:

```
src/
  backend/          # Pure TypeScript library (no server)
    types.ts        # All type definitions
    frameRegistry.ts # Central frame registry (single source of truth)
    symbolMap.ts    # ASCII ↔ Unicode mapping
    ast.ts          # AST factories and utilities
    lexer.ts        # Tokenizer
    parser.ts       # Recursive descent parser
    normalizer.ts   # Formula rewriting
    model.ts        # Kripke model validation
    constraints.ts  # Frame constraint checkers
    logicProfile.ts # Preset/custom logic profiles (derived from registry)
    checker.ts      # Bottom-up model checker
    dot.ts          # DOT graph generator (with atomFilter support)
    graphUtils.ts   # Graph utility functions
    service.ts      # Public API orchestrator
    index.ts        # Re-exports
  frontend/         # React + Tailwind UI
    components/     # UI components
    hooks/          # React hooks
    App.tsx         # Main app
  components/
    modal-logic-wireframe.tsx  # Original wireframe (preserved)
tests/
  backend/          # Unit tests (13 files)
  integration/      # Integration tests
docs/               # Documentation (LaTeX-standardized)
```

## Documentation

- [Syntax Guide](docs/syntax.md)
- [Normalization Rules](docs/normalization.md)
- [Frame Presets](docs/frame-presets.md)
- [Logic Configuration](docs/logic-configuration.md)
- [Backend API](docs/api.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run all tests |
| `npm run check` | TypeScript type checking |
| `npm run preview` | Preview production build |

## License

MIT
