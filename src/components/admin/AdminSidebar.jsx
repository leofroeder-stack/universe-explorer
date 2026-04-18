import React from 'react';
import { Settings, Flag, LayoutDashboard, Eye, Globe, ArrowLeft, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'visibility', label: 'Visibility Controls', icon: Eye },
  { id: 'features', label: 'Feature Flags', icon: Flag },
  { id: 'navigation', label: 'Navigation', icon: Globe },
  { id: 'settings', label: 'App Settings', icon: Settings },
  { id: 'textures', label: 'Textures', icon: Image },
];

export default function AdminSidebar({ active, onChange }) {
  const navigate = useNavigate();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card/40 flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-foreground">Admin Panel</p>
            <p className="text-[10px] text-muted-foreground font-body">Control Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-body transition-all ${
              active === id
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>
      </div>
    </aside>
  );
}