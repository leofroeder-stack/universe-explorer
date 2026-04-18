import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const APP_SETTINGS_SCHEMA = [
  {
    group: 'Branding',
    items: [
      { key: 'app_title', label: 'App Title', type: 'text', default: 'Luna Atlas', desc: 'Shown in the header' },
      { key: 'app_subtitle', label: 'App Subtitle', type: 'text', default: 'Interactive Moon Explorer', desc: 'Shown below the title' },
    ],
  },
  {
    group: 'Map Defaults',
    items: [
      { key: 'default_view', label: 'Default View', type: 'select', options: ['3d', '2d'], default: '3d', desc: 'Which view loads by default' },
      { key: 'default_planet', label: 'Default Planet', type: 'select', options: ['moon', 'mars'], default: 'moon', desc: 'Which planet is selected on load' },
    ],
  },
  {
    group: 'User Experience',
    items: [
      { key: 'autoplay_audio', label: 'Auto-play Audio', type: 'boolean', default: 'false', desc: 'Automatically play space audio on load' },
      { key: 'show_welcome_hint', label: 'Show Welcome Hint', type: 'boolean', default: 'true', desc: 'Show the drag/zoom hint on first load' },
    ],
  },
];

export default function AppSettingsPanel({ settings, onSettingsChange }) {
  const [saving, setSaving] = useState(null);
  const [localValues, setLocalValues] = useState({});

  const getValue = (key, defaultVal) => {
    if (localValues[key] !== undefined) return localValues[key];
    const s = settings.find(s => s.key === key && s.category === 'app');
    return s ? s.value : defaultVal;
  };

  const saveSetting = async (key, value, label) => {
    setSaving(key);
    const existing = settings.find(s => s.key === key && s.category === 'app');
    let updated;
    if (existing) {
      updated = await base44.entities.AppSettings.update(existing.id, { value });
      onSettingsChange(settings.map(s => s.id === existing.id ? { ...s, value } : s));
    } else {
      updated = await base44.entities.AppSettings.create({ key, value, category: 'app', label });
      onSettingsChange([...settings, updated]);
    }
    setLocalValues(prev => ({ ...prev, [key]: undefined }));
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading font-bold">App Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">Configure global application behavior and appearance.</p>
      </div>

      {APP_SETTINGS_SCHEMA.map(({ group, items }) => (
        <div key={group} className="rounded-xl border border-border bg-card/40 overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
          </div>
          <div className="divide-y divide-border/50">
            {items.map(({ key, label, type, default: def, desc, options }) => {
              const val = getValue(key, def);
              const isDirty = localValues[key] !== undefined;
              return (
                <div key={key} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-body font-medium text-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{desc}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {type === 'boolean' ? (
                        <>
                          <span className="text-xs text-muted-foreground font-body">{val === 'true' ? 'On' : 'Off'}</span>
                          <input
                            type="checkbox"
                            checked={val === 'true'}
                            onChange={e => {
                              const newVal = e.target.checked ? 'true' : 'false';
                              setLocalValues(prev => ({ ...prev, [key]: newVal }));
                              saveSetting(key, newVal, label);
                            }}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                        </>
                      ) : type === 'select' ? (
                        <select
                          value={val}
                          onChange={e => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                          className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={e => setLocalValues(prev => ({ ...prev, [key]: e.target.value }))}
                          className="px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary w-44"
                        />
                      )}
                      {(type !== 'boolean') && isDirty && (
                        <button
                          onClick={() => saveSetting(key, val, label)}
                          disabled={saving === key}
                          className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}