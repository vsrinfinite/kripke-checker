# Formula Normalization

The model checker includes a normalizer that rewrites formulas into equivalent, simplified forms using standard logical equivalences. Normalization runs automatically during evaluation, and the UI displays any applied simplifications.

## Rewrite Rules

| Rule | Before | After | Name |
|------|--------|-------|------|
| Double negation | $\neg\neg p$ | $p$ | Double negation elimination |
| Box-Diamond duality | $\neg\Diamond\neg p$ | $\Box p$ | Box-Diamond duality |
| Diamond-Box duality | $\neg\Box\neg p$ | $\Diamond p$ | Diamond-Box duality |
| De Morgan ($\wedge$) | $\neg(p \wedge q)$ | $\neg p \vee \neg q$ | De Morgan's law |
| De Morgan ($\vee$) | $\neg(p \vee q)$ | $\neg p \wedge \neg q$ | De Morgan's law |
| Implication elimination | $p \to q$ | $\neg p \vee q$ | Implication elimination |

## How It Works

1. Rules are applied bottom-up. The normalizer first rewrites children, then the current node
2. The process iterates until a fixed point is reached (no more rules apply)
3. Each rule application is recorded as a `NormalizationStep` with before/after strings
4. The normalizer is deterministic, meaning the same input always produces the same output

## Equivalence Checking

Two formulas are considered equivalent under normalization if they produce the same normalized form:

$$
\Box p \equiv \neg\Diamond\neg p
$$

$$
\Diamond p \equiv \neg\Box\neg p
$$

$$
\neg\neg p \equiv p
$$

## Frontend Display

When a formula can be simplified, the UI shows a banner:
- "Can be simplified" badge with the simplification
- Step-by-step list of applied rules
- Both original and normalized forms

> [!NOTE]
> Normalization messages come from the backend normalization output, not hardcoded frontend strings.

## Extensibility

New rules can be added to the `applyRules` function in `src/backend/normalizer.ts`. Each rule:
- Pattern-matches on AST structure
- Returns the rewritten AST
- Records a `NormalizationStep` with rule name, before, and after strings
