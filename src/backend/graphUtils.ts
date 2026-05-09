export function filterValuationByAtoms(
  valuation: Record<string, string[]>,
  atomSet: Set<string>,
): Record<string, string[]> {
  const filtered: Record<string, string[]> = {};
  for (const [atom, worlds] of Object.entries(valuation)) {
    if (atomSet.has(atom)) {
      filtered[atom] = worlds;
    }
  }
  return filtered;
}
