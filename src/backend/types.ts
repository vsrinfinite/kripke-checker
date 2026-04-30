// AST Node Types

export type AtomNode = { readonly type: 'atom'; readonly name: string };
export type NotNode = { readonly type: 'not'; readonly operand: FormulaNode };
export type AndNode = { readonly type: 'and'; readonly left: FormulaNode; readonly right: FormulaNode };
export type OrNode = { readonly type: 'or'; readonly left: FormulaNode; readonly right: FormulaNode };
export type ImpliesNode = { readonly type: 'implies'; readonly left: FormulaNode; readonly right: FormulaNode };
export type BoxNode = { readonly type: 'box'; readonly operand: FormulaNode };
export type DiamondNode = { readonly type: 'diamond'; readonly operand: FormulaNode };

export type FormulaNode = AtomNode | NotNode | AndNode | OrNode | ImpliesNode | BoxNode | DiamondNode;

// Token Types

export type TokenType =
  | 'ATOM' | 'NOT' | 'AND' | 'OR' | 'IMPLIES'
  | 'BOX' | 'DIAMOND' | 'LPAREN' | 'RPAREN' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// Kripke Model

export interface KripkeModel {
  worlds: string[];
  edges: Record<string, string[]>;
  valuation: Record<string, string[]>;
  startWorld?: string;
}

// Frame Constraints

export type FrameConstraint =
  | 'reflexive' | 'symmetric' | 'transitive' | 'serial' | 'euclidean'
  | 'functional' | 'partialFunctional' | 'empty' | 'discrete' | 'dense'
  | 'convergent' | 'wellFounded';

// Logic Presets

export type LogicPreset = 'K' | 'T' | 'K4' | 'KD' | 'KB' | 'S4' | 'S5' | 'KD45';

export interface LogicProfile {
  mode: 'preset' | 'custom';
  preset: LogicPreset | null;
  constraints: FrameConstraint[];
}

export interface SavedProfile {
  name: string;
  constraints: FrameConstraint[];
}

export interface ConflictError {
  constraints: [FrameConstraint, FrameConstraint];
  message: string;
}

// Normalization

export interface NormalizationStep {
  rule: string;
  before: string;
  after: string;
}

export interface NormalizationResult {
  original: FormulaNode;
  normalized: FormulaNode;
  steps: NormalizationStep[];
  changed: boolean;
}

// Validation

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Checking

export interface TruthSetEntry {
  formula: string;
  worlds: string[];
  method: string;
}

export interface WitnessInfo {
  formula: string;
  world: string;
  witnesses: string[];
}

export interface CounterexampleInfo {
  formula: string;
  world: string;
  counterexamples: string[];
}

export interface TraceStep {
  formula: string;
  world: string;
  result: boolean;
  reason: string;
}

export interface EvaluationResult {
  result: boolean;
  world: string;
  formula: string;
  truthSets: TruthSetEntry[];
  witnesses: WitnessInfo[];
  counterexamples: CounterexampleInfo[];
  trace: TraceStep[];
}

// Configurable Limits

export interface CheckLimits {
  maxAtoms?: number;
  maxWorlds?: number;
  maxFormulaDepth?: number;
}

// Constraint Check Result

export interface ConstraintCheckResult {
  constraint: FrameConstraint;
  satisfied: boolean;
}

// DOT Options

export interface DotOptions {
  title?: string;
  startWorld?: string;
  highlightWorlds?: string[];
  highlightEdges?: [string, string][];
  worldLabels?: Record<string, string>;
}

//  Public API

export interface CheckRequest {
  formula: string;
  model: KripkeModel;
  startWorld?: string;
  logicProfile?: LogicProfile;
  limits?: CheckLimits;
  autoRepair?: boolean;
}

export interface CheckResult {
  success: boolean;
  evaluation?: EvaluationResult;
  normalization?: NormalizationResult;
  constraintResults?: ConstraintCheckResult[];
  conflicts?: ConflictError[];
  dot?: string;
  modelUsed?: KripkeModel;
  warnings: string[];
  errors: string[];
}
