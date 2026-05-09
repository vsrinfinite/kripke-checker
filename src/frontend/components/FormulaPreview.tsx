import { useMemo } from 'react';
import { normalize } from '@backend/normalizer';
import { parse, ParseError } from '@backend/parser';
import { prettyPrint } from '@backend/ast';
import { Badge } from '@/components/ui/badge';

interface FormulaPreviewProps {
  formula: string;
}

export function FormulaPreview({ formula }: FormulaPreviewProps) {
  const preview = useMemo(() => {
    if (!formula.trim()) return { status: 'empty' as const };
    try {
      const ast = parse(formula);
      const pp = prettyPrint(ast);
      const norm = normalize(ast);
      return {
        status: 'ok' as const,
        pretty: pp,
        normalized: norm.changed ? prettyPrint(norm.normalized) : null,
        steps: norm.steps,
      };
    } catch (e) {
      return {
        status: 'error' as const,
        message: e instanceof ParseError ? e.message : (e as Error).message,
      };
    }
  }, [formula]);

  if (preview.status === 'empty') {
    return <div className="text-xs text-slate-400 italic">Enter a formula above</div>;
  }

  if (preview.status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        ⚠ {preview.message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border bg-white p-3">
        <div className="text-xs text-slate-500 mb-1">Parsed formula</div>
        <div className="font-mono text-lg">{preview.pretty}</div>
      </div>
      {preview.normalized && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
          <Badge variant="warning" className="mb-1">Can be simplified</Badge>
          <div className="mt-1 font-mono">
            {preview.pretty} → {preview.normalized}
          </div>
          {preview.steps.map((s, i) => (
            <div key={i} className="text-slate-500 mt-1">• {s.rule}</div>
          ))}
        </div>
      )}
    </div>
  );
}
