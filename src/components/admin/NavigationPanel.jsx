import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Globe } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'hide_nav_moon_explorer', label: 'Moon Explorer', desc: 'Main page link (/)' },
  { key: 'hide_nav_solar_system', label: 'Solar System', desc: 'Solar system page (/solar-system)' },
  { key: 'hide_nav_admin', label: 'Admin Panel', desc: 'Admin dashboard (/admin) — from user-facing nav' },
];

export default function NavigationPanel({ settings, onToggle }) {
  const isHidden = (key) => settings.find(s => s.key === key)?.value === 'true';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading font-bold">Navigation Controls</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">Show or hide navigation links and page access points.</p>
      </div>

      <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border">
          <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">Navigation Links</p>
        </div>
        <div className="divide-y divide-border/50">
          {NAV_ITEMS.map(({ key, label, desc }) => {
            const hidden = isHidden(key);
            return (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className={`text-sm font-body font-medium ${hidden ? 'text-muted-foreground/60 line-through' : 'text-foreground'}`}>{label}</p>
                  <p className="text-[11px] text-muted-foreground font-body">{desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-body px-1.5 py-0.5 rounded ${hidden ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                    {hidden ? 'Hidden' : 'Visible'}
                  </span>
                  <Switch
                    checked={!hidden}
                    onCheckedChange={() => onToggle(key, hidden, 'navigation', label)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}