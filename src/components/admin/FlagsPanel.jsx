import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Flag, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function FlagsPanel({ flags, onFlagsChange }) {
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const toggleFlag = async (flagId, currentEnabled) => {
    await base44.entities.FeatureFlag.update(flagId, { enabled: !currentEnabled });
    onFlagsChange(flags.map(f => f.id === flagId ? { ...f, enabled: !currentEnabled } : f));
  };

  const createFlag = async () => {
    if (!newKey.trim() || !newName.trim()) return;
    setCreating(true);
    const newFlag = await base44.entities.FeatureFlag.create({
      key: newKey.toLowerCase().replace(/\s+/g, '_'),
      name: newName,
      description: newDesc,
      enabled: false,
    });
    onFlagsChange([...flags, newFlag]);
    setNewKey(''); setNewName(''); setNewDesc('');
    setCreating(false);
  };

  const deleteFlag = async (flagId) => {
    await base44.entities.FeatureFlag.delete(flagId);
    onFlagsChange(flags.filter(f => f.id !== flagId));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flag className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading font-bold">Feature Flags</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">Toggle experimental or optional features on/off for all users.</p>
      </div>

      {/* Create */}
      <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
        <p className="text-sm font-body font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4 text-primary" /> New Feature Flag</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Key (e.g. dark_mode)"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="Display name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <input
          placeholder="Description (optional)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={createFlag}
          disabled={creating || !newKey.trim() || !newName.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-body font-medium hover:bg-primary/80 disabled:opacity-50 transition-all"
        >
          {creating ? 'Creating…' : 'Create Flag'}
        </button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border">
          <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">All Flags ({flags.length})</p>
        </div>
        {flags.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground font-body">No flags yet. Create one above.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {flags.map(flag => (
              <div key={flag.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-foreground">{flag.name}</p>
                  <p className="text-[10px] text-muted-foreground font-body font-mono">{flag.key}</p>
                  {flag.description && <p className="text-[11px] text-muted-foreground font-body mt-0.5">{flag.description}</p>}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`text-[10px] font-body px-1.5 py-0.5 rounded ${flag.enabled ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'}`}>
                    {flag.enabled ? 'On' : 'Off'}
                  </span>
                  <Switch checked={!!flag.enabled} onCheckedChange={() => toggleFlag(flag.id, flag.enabled)} />
                  <button onClick={() => deleteFlag(flag.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}