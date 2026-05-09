import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, CircleAlert } from 'lucide-react';
import type { CheckResult } from '@backend/types';

interface ResultPanelProps {
  result: CheckResult | null;
  error: string | null;
}

export function ResultPanel({ result, error }: ResultPanelProps) {
  if (error && !result) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600 shrink-0" />
            <div>
              <div className="text-lg font-semibold text-red-700">Error</div>
              <div className="text-xs text-red-600 mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl bg-slate-100 p-6 text-center text-sm text-slate-500">
        Click "Run Check" to evaluate
      </div>
    );
  }

  const evaluation = result.evaluation;

  return (
    <div className="space-y-4">
      {/* Main result */}
      {evaluation && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium text-slate-500">Status</div>
          <div className="mt-2 flex items-center gap-3">
            {evaluation.result ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            ) : (
              <XCircle className="h-7 w-7 text-red-500" />
            )}
            <div>
              <div className="text-2xl font-bold">{evaluation.result ? 'TRUE' : 'FALSE'}</div>
              <div className="text-xs text-slate-500">
                {evaluation.formula} at {evaluation.world}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <CircleAlert className="h-4 w-4" /> Warnings
          </div>
          {result.warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-600">• {w}</div>
          ))}
        </div>
      )}

      {/* Explanation trace */}
      {evaluation && evaluation.trace.length > 0 && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-3">Explanation</div>
          <div className="space-y-1.5 text-xs text-slate-600">
            {evaluation.trace.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge
                  variant={t.result ? 'success' : 'destructive'}
                  className="rounded-full text-[10px] shrink-0 mt-0.5"
                >
                  {t.result ? 'T' : 'F'}
                </Badge>
                <span>
                  <span className="font-mono font-medium">{t.formula}</span>: {t.reason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Witnesses */}
      {evaluation && evaluation.witnesses.length > 0 && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-2">Witnesses (◇)</div>
          <div className="space-y-1 text-xs text-slate-600">
            {evaluation.witnesses.map((w, i) => (
              <div key={i}>
                <span className="font-mono">{w.formula}</span> at {w.world}: witnesses = [{w.witnesses.join(', ')}]
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Counterexamples */}
      {evaluation && evaluation.counterexamples.length > 0 && (
        <div className="rounded-2xl border border-red-100 p-4">
          <div className="text-sm font-medium mb-2 text-red-700">Counterexamples (□)</div>
          <div className="space-y-1 text-xs text-red-600">
            {evaluation.counterexamples.map((c, i) => (
              <div key={i}>
                <span className="font-mono">{c.formula}</span> at {c.world}: failing = [{c.counterexamples.join(', ')}]
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraint results */}
      {result.constraintResults && result.constraintResults.length > 0 && (
        <div className="rounded-2xl border p-4">
          <div className="text-sm font-medium mb-2">Constraint Results</div>
          <div className="flex flex-wrap gap-1.5">
            {result.constraintResults.map((cr, i) => (
              <Badge
                key={i}
                variant={cr.satisfied ? 'success' : 'destructive'}
                className="rounded-full"
              >
                {cr.constraint}: {cr.satisfied ? '✓' : '✗'}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
