import { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import type { KripkeModel, DotOptions } from '@backend/types';
import { modelToDot } from '@backend/dot';

export type GraphDisplayMode = 'full' | 'formula-aware';

interface KripkeGraphProps {
  dot?: string;
  displayMode: GraphDisplayMode;
  onDisplayModeChange: (mode: GraphDisplayMode) => void;
  formulaAtoms: Set<string>;
  modelUsed?: KripkeModel;
  dotOptions?: DotOptions;
}

export function KripkeGraph({
  dot,
  displayMode,
  onDisplayModeChange,
  formulaAtoms,
  modelUsed,
  dotOptions = {},
}: KripkeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute effective DOT based on display mode.
  // In formula-aware mode, regenerate DOT with atomFilter — NO re-evaluation.
  const effectiveDot = useMemo(() => {
    if (!dot || !modelUsed) return dot;

    if (displayMode === 'formula-aware' && formulaAtoms.size > 0) {
      return modelToDot(modelUsed, {
        ...dotOptions,
        atomFilter: Array.from(formulaAtoms),
      });
    }

    return dot;
  }, [dot, displayMode, formulaAtoms, modelUsed, dotOptions]);

  useEffect(() => {
    if (!effectiveDot) { setSvg(''); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    import('@viz-js/viz').then(async (vizModule) => {
      if (cancelled) return;
      try {
        const viz = await vizModule.instance();
        const result = viz.renderString(effectiveDot, { format: 'svg', engine: 'dot' });
        if (!cancelled) setSvg(result);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }).catch(e => {
      if (!cancelled) {
        setError('Failed to load Graphviz renderer');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [effectiveDot]);

  const exportDot = () => {
    if (!effectiveDot) return;
    const blob = new Blob([effectiveDot], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kripke-model.dot';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Display mode toggle */}
        <div className="flex rounded-xl border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              displayMode === 'full'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => onDisplayModeChange('full')}
            title="Show all atoms present in the model valuation"
          >
            Full Model
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${
              displayMode === 'formula-aware'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => onDisplayModeChange('formula-aware')}
            title="Show only atoms from the current formula"
          >
            Formula-Aware
          </button>
        </div>

        {effectiveDot && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={exportDot}>
            <Download className="mr-2 h-3 w-3" /> Export .dot
          </Button>
        )}
      </div>

      {/* Display mode label */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500" title="Graphs visualize models, not formulas.">
        <Info className="h-3 w-3 shrink-0" />
        <span>
          {displayMode === 'full'
            ? 'Showing full model valuation'
            : 'Showing only atoms from current formula'}
        </span>
      </div>

      <div className="relative min-h-[300px] overflow-auto rounded-2xl border bg-white p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-sm text-slate-500 animate-pulse">Rendering graph...</div>
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 p-4">{error}</div>
        )}
        {svg ? (
          <div
            ref={containerRef}
            className="w-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : !loading && !error && (
          <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">
            Run a check to see the Kripke model graph
          </div>
        )}
      </div>
    </div>
  );
}
