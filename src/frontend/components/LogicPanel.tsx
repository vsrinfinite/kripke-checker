import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import type { LogicPreset, FrameConstraint, ConflictError, SavedProfile, NamedFrameDefinition } from '@backend/types';
import { CONSTRAINT_CATEGORIES } from '@backend/logicProfile';
import { getFrameRegistry } from '@backend/frameRegistry';
import { CircleAlert, Save, Trash2, Info } from 'lucide-react';

// Derive presets from the central registry — NOT hardcoded.
const REGISTRY = getFrameRegistry();

interface LogicPanelProps {
  mode: 'preset' | 'custom';
  preset: LogicPreset;
  constraints: FrameConstraint[];
  conflicts: ConflictError[];
  matchedPreset: LogicPreset | null;
  matchedDefinition: NamedFrameDefinition | null;
  savedProfiles: SavedProfile[];
  onSelectPreset: (p: LogicPreset) => void;
  onToggleConstraint: (c: FrameConstraint) => void;
  onSaveProfile: (name: string) => void;
  onLoadProfile: (p: SavedProfile) => void;
  onDeleteProfile: (name: string) => void;
  onSetMode: (mode: 'preset' | 'custom') => void;
}

export function LogicPanel({
  mode, preset, constraints, conflicts, matchedPreset, matchedDefinition,
  savedProfiles,
  onSelectPreset, onToggleConstraint,
  onSaveProfile, onLoadProfile, onDeleteProfile,
  onSetMode,
}: LogicPanelProps) {
  const [profileName, setProfileName] = useState('');

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'preset' ? 'default' : 'outline'}
          size="sm"
          className="rounded-xl flex-1"
          onClick={() => onSetMode('preset')}
        >
          Preset
        </Button>
        <Button
          variant={mode === 'custom' ? 'default' : 'outline'}
          size="sm"
          className="rounded-xl flex-1"
          onClick={() => onSetMode('custom')}
        >
          Custom
        </Button>
      </div>

      {/* Preset selection — driven from FRAME_REGISTRY */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Logic preset</p>
        <div className="flex gap-2 flex-wrap">
          {REGISTRY.map(def => (
            <Button
              key={def.name}
              variant={preset === def.name && mode === 'preset' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectPreset(def.name)}
              className="rounded-xl"
              title={`${def.name}: ${def.description}`}
            >
              {def.name}
            </Button>
          ))}
        </div>

        {/* Active preset description */}
        {mode === 'preset' && (
          <div className="flex items-start gap-1.5 text-xs text-slate-500">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{REGISTRY.find(d => d.name === preset)?.description}</span>
          </div>
        )}

        {/* Active constraint badges for selected preset */}
        {mode === 'preset' && (
          <div className="flex gap-1 flex-wrap">
            {(REGISTRY.find(d => d.name === preset)?.constraints ?? []).map(c => (
              <Badge key={c} variant="secondary" className="rounded-full text-xs">
                {c}
              </Badge>
            ))}
            {(REGISTRY.find(d => d.name === preset)?.constraints ?? []).length === 0 && (
              <span className="text-xs text-slate-400 italic">No frame constraints</span>
            )}
          </div>
        )}

        {/* Custom-mode exact-match banner — conflict warnings take precedence */}
        {matchedDefinition && mode === 'custom' && conflicts.length === 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                This custom configuration matches{' '}
                <Badge variant="secondary" className="rounded-full font-semibold">{matchedDefinition.name}</Badge>
                {' — '}{matchedDefinition.description}
              </span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Constraint checkboxes */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Frame constraints</p>
        {CONSTRAINT_CATEGORIES.map(cat => (
          <div key={cat.name} className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{cat.name}</p>
            <div className="rounded-xl border p-3 space-y-2">
              {cat.constraints.map(c => (
                <label key={c} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 rounded-lg p-1 -m-1 transition-colors">
                  <Checkbox
                    checked={constraints.includes(c)}
                    onCheckedChange={() => onToggleConstraint(c)}
                  />
                  <span className="capitalize">{c}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Active constraints summary */}
      <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
        Active: <span className="font-medium text-slate-900">
          {constraints.length > 0 ? constraints.join(', ') : 'none'}
        </span>
      </div>

      {/* Conflicts — always shown with highest priority */}
      {conflicts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
            <CircleAlert className="h-4 w-4" /> Constraint Conflicts
          </div>
          {conflicts.map((c, i) => (
            <div key={i} className="text-xs text-red-600">
              • {c.constraints.join(' + ')}: {c.message}
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Save/Load profiles */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Saved profiles</p>
        <div className="flex gap-2">
          <Input
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            placeholder="Profile name..."
            className="h-8 rounded-lg text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() => { if (profileName.trim()) { onSaveProfile(profileName.trim()); setProfileName(''); } }}
            disabled={!profileName.trim()}
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
        {savedProfiles.length > 0 && (
          <div className="space-y-1">
            {savedProfiles.map(p => (
              <div key={p.name} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                <button
                  className="hover:text-primary transition-colors cursor-pointer"
                  onClick={() => onLoadProfile(p)}
                >
                  {p.name} <span className="text-slate-400">({p.constraints.join(', ')})</span>
                </button>
                <button onClick={() => onDeleteProfile(p.name)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
