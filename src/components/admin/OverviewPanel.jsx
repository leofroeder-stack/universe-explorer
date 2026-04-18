import React from 'react';
import { Flag, Eye, Globe, Settings, Users, Shield } from 'lucide-react';

export default function OverviewPanel({ flags, settings, onNavigate }) {
  const enabledFlags = flags.filter(f => f.enabled).length;
  const hiddenItems = settings.filter(s => s.value === 'true' && s.category !== 'app').length;

  const stats = [
    { label: 'Feature Flags', value: flags.length, sub: `${enabledFlags} enabled`, icon: Flag, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Hidden Items', value: hiddenItems, sub: 'items hidden from users', icon: Eye, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'App Settings', value: settings.filter(s => s.category === 'app').length, sub: 'configured', icon: Settings, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  const quickLinks = [
    { id: 'visibility', label: 'Hide/Show UI Elements', icon: Eye, desc: 'Control what users see on every page' },
    { id: 'features', label: 'Feature Flags', icon: Flag, desc: 'Toggle experimental features on/off' },
    { id: 'navigation', label: 'Navigation Links', icon: Globe, desc: 'Show or hide navigation items' },
    { id: 'settings', label: 'App Settings', icon: Settings, desc: 'Configure global app behavior' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading font-bold">Admin Control Center</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">Full control over all app features, visibility, and settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="p-4 rounded-xl border border-border bg-card/60">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-heading font-bold">{value}</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground/60 font-body">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-heading font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Quick Access</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="p-4 rounded-xl border border-border bg-card/40 hover:bg-card/80 hover:border-primary/40 text-left transition-all group"
            >
              <Icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-sm font-body font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}