import type { KripkeModel, DotOptions } from './types';
import { getAtomsAtWorld } from './model';

export function modelToDot(model: KripkeModel, options: DotOptions = {}): string {
  const lines: string[] = [];
  const { title, startWorld, highlightWorlds = [], highlightEdges = [] } = options;

  lines.push('digraph KripkeModel {');
  lines.push('  rankdir=LR;');
  lines.push('  node [shape=circle, style=filled, fillcolor="#f8fafc", color="#334155", fontname="Inter"];');
  lines.push('  edge [color="#64748b", fontname="Inter"];');

  if (title) {
    lines.push(`  label="${title}";`);
    lines.push('  labelloc=t;');
    lines.push('  fontname="Inter";');
  }

  // Nodes
  for (const w of model.worlds) {
    const atoms = getAtomsAtWorld(model, w);
    const label = options.worldLabels?.[w] ?? (atoms.length > 0 ? `${w}\\n{${atoms.join(', ')}}` : w);
    const attrs: string[] = [`label="${label}"`];

    if (w === (startWorld ?? model.startWorld)) {
      attrs.push('penwidth=3', 'color="#0f172a"', 'fillcolor="#e2e8f0"');
    }

    if (highlightWorlds.includes(w)) {
      attrs.push('fillcolor="#bbf7d0"', 'color="#16a34a"');
    }

    lines.push(`  "${w}" [${attrs.join(', ')}];`);
  }

  // Edges
  for (const w of model.worlds) {
    for (const v of (model.edges[w] ?? [])) {
      const isHighlighted = highlightEdges.some(([a, b]) => a === w && b === v);
      const attrs = isHighlighted ? ' [color="#dc2626", penwidth=2]' : '';
      lines.push(`  "${w}" -> "${v}"${attrs};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}
