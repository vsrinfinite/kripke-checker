import React, { useState } from 'react';
import type { KripkeModel } from '../../backend/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModelEditorProps {
  modelJson: string;
  onChange: (value: string) => void;
  defaultJson: string;
}

const EXAMPLE_MODELS: Record<string, object> = {
  'Simple chain': {
    worlds: ['w0', 'w1', 'w2'],
    edges: { w0: ['w1'], w1: ['w2'] },
    valuation: { p: ['w0', 'w1'], q: ['w2'] },
    startWorld: 'w0',
  },
  'Reflexive loop': {
    worlds: ['w0', 'w1'],
    edges: { w0: ['w0', 'w1'], w1: ['w1', 'w0'] },
    valuation: { p: ['w0'], q: ['w1'] },
    startWorld: 'w0',
  },
  'Dead-end': {
    worlds: ['w0', 'w1'],
    edges: { w0: ['w1'] },
    valuation: { p: ['w0', 'w1'] },
    startWorld: 'w0',
  },
  'Diamond shape': {
    worlds: ['w0', 'w1', 'w2', 'w3'],
    edges: { w0: ['w1', 'w2'], w1: ['w3'], w2: ['w3'] },
    valuation: { p: ['w0', 'w3'], q: ['w1', 'w2'] },
    startWorld: 'w0',
  },
};

export function ModelEditor({ modelJson, onChange, defaultJson }: ModelEditorProps) {
  const [parseError, setParseError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    onChange(value);
    try {
      JSON.parse(value);
      setParseError(null);
    } catch (e) {
      setParseError((e as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Model (JSON)</p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-xs"
          onClick={() => { onChange(defaultJson); setParseError(null); }}
        >
          Reset
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {Object.entries(EXAMPLE_MODELS).map(([name, model]) => (
          <Button
            key={name}
            variant="outline"
            size="sm"
            className="rounded-lg text-xs"
            onClick={() => { onChange(JSON.stringify(model, null, 2)); setParseError(null); }}
          >
            {name}
          </Button>
        ))}
      </div>

      <textarea
        value={modelJson}
        onChange={e => handleChange(e.target.value)}
        className="w-full h-[200px] rounded-xl border bg-white p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
        id="model-editor"
      />

      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          ⚠ Invalid JSON: {parseError}
        </div>
      )}
    </div>
  );
}
