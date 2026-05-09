import { Badge } from '@/components/ui/badge';
import type { TruthSetEntry } from '@backend/types';

interface SubformulaTableProps {
  truthSets: TruthSetEntry[];
  worlds: string[];
}

export function SubformulaTable({ truthSets, worlds }: SubformulaTableProps) {
  if (truthSets.length === 0) {
    return (
      <div className="text-sm text-slate-400 text-center py-8">
        Run a check to see the subformula truth table
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border-b px-4 py-3 text-left font-medium sticky left-0 bg-slate-50 z-10">
              Subformula
            </th>
            {worlds.map(w => (
              <th key={w} className="border-b px-4 py-3 text-center font-medium">{w}</th>
            ))}
            <th className="border-b px-4 py-3 text-left font-medium">Method</th>
          </tr>
        </thead>
        <tbody>
          {truthSets.map((ts, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-slate-50/50 hover:bg-blue-50/50 transition-colors">
              <td className="border-b px-4 py-2.5 font-mono text-xs sticky left-0 bg-inherit z-10">
                {ts.formula}
              </td>
              {worlds.map(w => {
                const isTrue = ts.worlds.includes(w);
                return (
                  <td key={w} className="border-b px-4 py-2.5 text-center">
                    <Badge
                      variant={isTrue ? 'default' : 'secondary'}
                      className="rounded-full text-[10px] w-6 h-6 flex items-center justify-center mx-auto"
                    >
                      {isTrue ? 'T' : 'F'}
                    </Badge>
                  </td>
                );
              })}
              <td className="border-b px-4 py-2.5 text-xs text-slate-500">{ts.method}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
