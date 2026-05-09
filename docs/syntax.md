# Syntax Guide

The modal logic model checker supports both Unicode symbols and keyboard-friendly ASCII syntax. The backend normalizes all inputs into Unicode for parsing and evaluation.

## Supported Connectives

| Connective | ASCII Syntax | Unicode | Description |
|------------|-------------|---------|-------------|
| Negation | `!` or `~` | `¬` | Logical NOT ($\neg$) |
| Conjunction | `&` or `^` or `/\` | `∧` | Logical AND ($\wedge$) |
| Disjunction | `\|` or `\/` | `∨` | Logical OR ($\vee$) |
| Implication | `->` | `→` | Material implication ($\to$) |
| Box | `[]` | `□` | Necessity ($\Box$), meaning all successors |
| Diamond | `<>` | `◇` | Possibility ($\Diamond$), meaning some successor |

> [!IMPORTANT]
> Lowercase `v` is **not** an alias for disjunction. Since single lowercase letters are valid atomic propositions, `v` is parsed as an atom. Use `|` or `\/` for disjunction.

## Operator Precedence

From lowest to highest:

1. $\to$ (implication), which is right-associative
2. $\vee$ (disjunction), which is left-associative
3. $\wedge$ (conjunction), which is left-associative
4. $\neg$, $\Box$, $\Diamond$ (prefix operators)
5. Atoms and parenthesized subexpressions

Parentheses override precedence as usual.

## Atoms

Atomic propositions consist of lowercase letters optionally followed by lowercase letters and digits:
- Valid: `p`, `q`, `hello`, `p1`, `var2`
- Invalid: `P` (uppercase), `1p` (starts with digit)

## Examples

| Input (ASCII) | Parsed (Unicode) | LaTeX |
|---------------|-----------------|-------|
| `[](p -> <>q) /\ r` | `□(p → ◇q) ∧ r` | $\Box(p \to \Diamond q) \wedge r$ |
| `!p & q` | `¬p ∧ q` | $\neg p \wedge q$ |
| `p \| q -> r` | `p ∨ q → r` | $p \vee q \to r$ |
| `<>[]p` | `◇□p` | $\Diamond\Box p$ |
| `!!p` | `¬¬p` | $\neg\neg p$ |
