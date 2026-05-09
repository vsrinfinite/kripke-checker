import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAliasTable } from '@backend/symbolMap';

interface FormulaInputProps {
  value: string;
  onChange: (value: string) => void;
}

const CONNECTIVE_BUTTONS = [
  ['¬', 'NOT'], ['∧', 'AND'], ['∨', 'OR'], ['→', 'IMP'],
  ['□', 'BOX'], ['◇', 'DIA'], ['(', 'L('], [')', 'R)'],
] as const;

export function FormulaInput({ value, onChange }: FormulaInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const aliases = getAliasTable();

  const insertSymbol = (sym: string) => {
    const input = inputRef.current;
    if (!input) { onChange(value + sym); return; }
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newVal = value.slice(0, start) + sym + value.slice(end);
    onChange(newVal);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + sym.length, start + sym.length);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Formula input</p>
        <Badge variant="secondary" className="rounded-full text-xs">Unicode + ASCII</Badge>
      </div>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl text-base font-mono"
        placeholder="□(p → ◇q)  or  [](p -> <>q)"
        id="formula-input"
      />
      <div className="grid grid-cols-4 gap-2">
        {CONNECTIVE_BUTTONS.map(([sym]) => (
          <Button
            key={sym}
            variant="outline"
            className="rounded-xl font-mono font-medium text-base"
            onClick={() => insertSymbol(sym)}
            type="button"
          >
            {sym}
          </Button>
        ))}
      </div>
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-700 transition-colors">
          Keyboard shortcuts
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1 p-2 rounded-lg bg-slate-50 border">
          {aliases.map(a => (
            <div key={a.unicode} className="flex items-center gap-2">
              <code className="text-xs bg-slate-100 px-1 rounded font-mono">{a.ascii}</code>
              <span>→</span>
              <span className="font-mono">{a.unicode}</span>
              <span className="text-slate-400">({a.description})</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
