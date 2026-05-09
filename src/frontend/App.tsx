import { useCallback, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/Header.tsx';
import { FormulaInput } from '@/components/FormulaInput.tsx';
import { FormulaPreview } from '@/components/FormulaPreview.tsx';
import { FormulaBuilder } from '@/components/FormulaBuilder.tsx';
import { LogicPanel } from '@/components/LogicPanel.tsx';
import { KripkeGraph } from '@/components/KripkeGraph.tsx';
import type { GraphDisplayMode } from '@/components/KripkeGraph.tsx';
import { ModelEditor } from '@/components/ModelEditor.tsx';
import { ResultPanel } from '@/components/ResultPanel.tsx';
import { SubformulaTable } from '@/components/SubformulaTable.tsx';
import { NormalizationBanner } from '@/components/NormalizationBanner.tsx';
import { useModelChecker } from '@/hooks/useModelChecker.ts';
import { useLogicProfile } from '@/hooks/useLogicProfile.ts';
import { prettyPrint } from '@backend/ast';
import type { DotOptions } from '@backend/types';

export default function App() {
  const {
    formula, setFormula,
    modelJson, setModelJson,
    result, error,
    autoRepair, setAutoRepair,
    runCheck,
    formulaAtoms,
    defaultModelJson,
  } = useModelChecker();

  const {
    mode, preset, constraints, profile,
    conflicts, matchedPreset, matchedDefinition,
    savedProfiles,
    selectPreset, toggleConstraint,
    saveProfile, loadProfile, deleteProfile,
    setMode,
  } = useLogicProfile();

  const [graphDisplayMode, setGraphDisplayMode] = useState<GraphDisplayMode>('full');

  const handleRunCheck = useCallback(() => {
    runCheck(profile);
  }, [runCheck, profile]);

  const handleExportDot = useCallback(() => {
    if (!result?.dot) return;
    const blob = new Blob([result.dot], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kripke-model.dot';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  // Compute DOT options to pass to KripkeGraph for formula-aware regeneration
  const dotOptions = useMemo<DotOptions>(() => {
    if (!result?.evaluation) return {};
    return {
      startWorld: result.evaluation.world,
      highlightWorlds: result.evaluation.witnesses.flatMap(w => w.witnesses),
    };
  }, [result]);

  const worlds = result?.modelUsed?.worlds ?? [];
  const truthSets = result?.evaluation?.truthSets ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <Header onRunCheck={handleRunCheck} onExport={result?.dot ? handleExportDot : undefined} />

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)_380px]">
          {/* Left panel — Formula & Logic */}
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Formula &amp; Logic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormulaInput value={formula} onChange={setFormula} />
                <FormulaBuilder onInsert={setFormula} />
                <Separator />
                <FormulaPreview formula={formula} />

                {result?.normalization?.changed && (
                  <>
                    <Separator />
                    <NormalizationBanner
                      steps={result.normalization.steps}
                      originalFormula={prettyPrint(result.normalization.original)}
                      normalizedFormula={prettyPrint(result.normalization.normalized)}
                    />
                  </>
                )}

                <Separator />
                <LogicPanel
                  mode={mode}
                  preset={preset}
                  constraints={constraints}
                  conflicts={conflicts}
                  matchedPreset={matchedPreset}
                  matchedDefinition={matchedDefinition}
                  savedProfiles={savedProfiles}
                  onSelectPreset={selectPreset}
                  onToggleConstraint={toggleConstraint}
                  onSaveProfile={saveProfile}
                  onLoadProfile={loadProfile}
                  onDeleteProfile={deleteProfile}
                  onSetMode={setMode}
                />

                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Options</p>
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <Checkbox
                      checked={autoRepair}
                      onCheckedChange={(v) => setAutoRepair(Boolean(v))}
                    />
                    <span>Auto-repair model to satisfy constraints</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center panel — Graph + Model */}
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Kripke Model</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <KripkeGraph
                  dot={result?.dot}
                  displayMode={graphDisplayMode}
                  onDisplayModeChange={setGraphDisplayMode}
                  formulaAtoms={formulaAtoms}
                  modelUsed={result?.modelUsed}
                  dotOptions={dotOptions}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Model Editor</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelEditor
                  modelJson={modelJson}
                  onChange={setModelJson}
                  defaultJson={defaultModelJson}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right panel — Results */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Result &amp; Trace</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultPanel result={result} error={error} />
            </CardContent>
          </Card>
        </div>

        {/* Bottom panel — Subformula Table */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Subformula Table</CardTitle>
          </CardHeader>
          <CardContent>
            <SubformulaTable truthSets={truthSets} worlds={worlds} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
