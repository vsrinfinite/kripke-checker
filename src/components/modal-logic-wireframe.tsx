import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CircleAlert,
  Download,
  FolderOpen,
  HelpCircle,
  Play,
  Save,
  ZoomIn,
  Move,
  SquareTerminal,
} from "lucide-react";

type Node = {
  id: string;
  x: number;
  y: number;
  label: string;
  atoms: string[];
  highlighted?: boolean;
};

const nodes: Node[] = [
  { id: "w0", x: 18, y: 22, label: "w0", atoms: ["p", "q"], highlighted: true },
  { id: "w1", x: 48, y: 4, label: "w1", atoms: ["p"] },
  { id: "w2", x: 78, y: 22, label: "w2", atoms: ["q"] },
  { id: "w3", x: 48, y: 54, label: "w3", atoms: [] },
  { id: "w4", x: 78, y: 54, label: "w4", atoms: ["p", "q"] },
];

const edges = [
  ["w0", "w1"],
  ["w1", "w2"],
  ["w1", "w3"],
  ["w0", "w4"],
  ["w2", "w4"],
  ["w3", "w4"],
] as const;

const truthRows = [
  ["p", ["T", "F", "T", "F", "T"], "atom lookup"],
  ["q", ["T", "F", "T", "F", "T"], "atom lookup"],
  ["◇q", ["T", "T", "T", "F", "T"], "exists successor"],
  ["p → ◇q", ["T", "T", "T", "T", "T"], "implication"],
  ["□(p → ◇q)", ["T", "T", "T", "T", "T"], "all successors pass"],
];

export default function ModalLogicWireframe() {
  const [formula, setFormula] = useState("□(p → ◇q)");
  const [preset, setPreset] = useState("S4");
  const [constraints, setConstraints] = useState({
    reflexive: true,
    symmetric: false,
    transitive: true,
    serial: false,
    euclidean: false,
  });

  const selectedConstraints = useMemo(
    () =>
      Object.entries(constraints)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(" + ") || "none",
    [constraints],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <Card className="shadow-sm rounded-2xl">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <SquareTerminal className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                      Modal Logic Model Checker
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                      Finite Kripke models • configurable frame constraints • bottom-up evaluation
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl">
                  <FolderOpen className="mr-2 h-4 w-4" /> Load Model
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button className="rounded-xl">
                  <Play className="mr-2 h-4 w-4" /> Run Check
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <HelpCircle className="mr-2 h-4 w-4" /> Explain
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          {/* Left panel */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Formula &amp; Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Formula input</p>
                  <Badge variant="secondary" className="rounded-full">Unicode mode</Badge>
                </div>
                <Input
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="h-12 rounded-xl text-base font-mono"
                  placeholder="□(p → ◇q)"
                />
                <div className="grid grid-cols-4 gap-2">
                  {[
                    ["¬", "not"],
                    ["∧", "and"],
                    ["∨", "or"],
                    ["→", "implies"],
                    ["□", "box"],
                    ["◇", "diamond"],
                    ["(", "left"],
                    [")", "right"],
                  ].map(([sym]) => (
                    <Button key={sym} variant="outline" className="rounded-xl font-medium">
                      {sym}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Keyboard input can be normalized to Unicode. The builder can mirror the AST.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Logic preset</p>
                <div className="flex gap-2 flex-wrap">
                  {['K', 'T', 'S4', 'S5', 'Custom'].map((p) => (
                    <Button
                      key={p}
                      variant={preset === p ? 'default' : 'outline'}
                      onClick={() => setPreset(p)}
                      className="rounded-xl"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Frame constraints</p>
                <div className="space-y-3 rounded-2xl border p-4">
                  {([
                    ["reflexive", "Reflexive"],
                    ["symmetric", "Symmetric"],
                    ["transitive", "Transitive"],
                    ["serial", "Serial"],
                    ["euclidean", "Euclidean"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={constraints[key]}
                        onCheckedChange={(v) =>
                          setConstraints((prev) => ({ ...prev, [key]: Boolean(v) }))
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-xs text-slate-600">
                  Active constraints: <span className="font-medium text-slate-900">{selectedConstraints}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Model settings</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-slate-500">Start world</div>
                    <div className="mt-1 font-medium">w0</div>
                  </div>
                  <div className="rounded-xl border p-3">
                    <div className="text-xs text-slate-500">Atomic symbols</div>
                    <div className="mt-1 font-medium">p, q, r, ...</div>
                  </div>
                </div>
                <div className="rounded-xl border p-3 text-xs text-slate-500">
                  Suggested controls: limit atoms, enforce parentheses, constrain formula depth.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Center panel */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Kripke Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <ZoomIn className="mr-2 h-4 w-4" /> Zoom
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Move className="mr-2 h-4 w-4" /> Pan
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Fit
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Reset
                </Button>
              </div>

              <div className="relative h-[420px] overflow-hidden rounded-2xl border bg-white">
                <div className="absolute left-4 top-3 text-xs text-slate-500">Accessibility graph</div>
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <defs>
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
                    </marker>
                  </defs>
                  {edges.map(([a, b], i) => {
                    const na = nodes.find((n) => n.id === a)!;
                    const nb = nodes.find((n) => n.id === b)!;
                    return (
                      <line
                        key={i}
                        x1={na.x}
                        y1={na.y}
                        x2={nb.x}
                        y2={nb.y}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        markerEnd="url(#arrow)"
                        className="text-slate-700"
                      />
                    );
                  })}
                  {nodes.map((n) => (
                    <g key={n.id}>
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="5.2"
                        className={cn(
                          n.highlighted ? "fill-slate-900 stroke-slate-900" : "fill-white stroke-slate-800",
                        )}
                        strokeWidth="1.5"
                      />
                      <text x={n.x - 4.3} y={n.y + 15} fontSize="4.2" className="fill-slate-900">
                        {n.label}
                      </text>
                      <text x={n.x - 7} y={n.y - 8} fontSize="3.5" className="fill-slate-500">
                        {n.atoms.join(', ') || '—'}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="rounded-2xl border p-3 text-xs text-slate-600">
                Model status: valid under selected constraints • start world: w0 • 5 worlds • 6 edges
              </div>
            </CardContent>
          </Card>

          {/* Right panel */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Result &amp; Trace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border p-4">
                <div className="text-sm font-medium text-slate-500">Status</div>
                <div className="mt-2 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <div className="text-2xl font-semibold">TRUE</div>
                    <div className="text-xs text-slate-500">at w0</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm font-medium mb-3">Explanation</div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p>□: all successors of w0 satisfy (p → ◇q)</p>
                  <p>p holds at the checked worlds</p>
                  <p>◇q has a witness successor</p>
                  <p>No violating successor found</p>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="text-sm font-medium mb-3">Witness &amp; Counterexample</div>
                <div className="space-y-2 text-xs text-slate-600">
                  <p>Witness for ◇q: w2</p>
                  <p>Counterexample: none</p>
                  <p>Checked subformula cache: enabled</p>
                  <p>Evaluation mode: bottom-up</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-100 p-3 text-xs text-slate-600">
                This panel is where trace output, witnesses, and failures should appear.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom panel */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Subformula Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border-b px-4 py-3 text-left font-medium">Subformula</th>
                    {nodes.map((n) => (
                      <th key={n.id} className="border-b px-4 py-3 text-left font-medium">
                        {n.label}
                      </th>
                    ))}
                    <th className="border-b px-4 py-3 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {truthRows.map(([sf, vals, note]) => (
                    <tr key={sf} className="odd:bg-white even:bg-slate-50">
                      <td className="border-b px-4 py-3 font-mono">{sf}</td>
                      {(vals as string[]).map((v, idx) => (
                        <td key={idx} className="border-b px-4 py-3">
                          <Badge variant={v === "T" ? "default" : "secondary"} className="rounded-full">
                            {v}
                          </Badge>
                        </td>
                      ))}
                      <td className="border-b px-4 py-3 text-slate-600">{note as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
