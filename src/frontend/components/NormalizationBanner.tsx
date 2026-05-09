import { Badge } from '@/components/ui/badge';
import type { NormalizationStep } from '@backend/types';

interface NormalizationBannerProps {
  steps: NormalizationStep[];
  originalFormula?: string;
  normalizedFormula?: string;
}

export function NormalizationBanner({ steps, originalFormula, normalizedFormula }: NormalizationBannerProps) {
  if (steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700">Normalization</Badge>
        {originalFormula && normalizedFormula && (
          <span className="text-xs text-blue-700 font-mono">
            {originalFormula} → {normalizedFormula}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {steps.map((s, i) => (
          <div key={i} className="text-xs text-blue-600">
            <span className="font-medium">Step {i + 1}:</span> {s.rule}
            <span className="text-blue-400 ml-2 font-mono">{s.before} → {s.after}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
