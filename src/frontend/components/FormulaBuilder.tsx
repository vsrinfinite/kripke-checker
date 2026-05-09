// FormulaBuilder (recursive formula construction. Basic V1 implementation)
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FormulaBuilderProps {
  onInsert: (formula: string) => void;
}

const TEMPLATES = [
  { label: '□(p → q)', formula: '□(p → q)' },
  { label: '◇p ∧ □q', formula: '◇p ∧ □q' },
  { label: '□(p → ◇q)', formula: '□(p → ◇q)' },
  { label: '¬◇¬p', formula: '¬◇¬p' },
  { label: 'p → □p', formula: 'p → □p' },
  { label: '□p → p', formula: '□p → p' },
];

export function FormulaBuilder({ onInsert }: FormulaBuilderProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-medium">Quick templates</p>
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATES.map(t => (
          <Button
            key={t.formula}
            variant="outline"
            size="sm"
            className="rounded-lg font-mono text-xs"
            onClick={() => onInsert(t.formula)}
          >
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
