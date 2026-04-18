import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';

// All hideable UI elements in the app grouped by page/section
const VISIBILITY_ITEMS = [
  {
    group: 'MoonExplorer — Header',
    items: [
      { key: 'hide_planet_selector', label: 'Planet Selector (Moon/Mars toggle)' },
      { key: 'hide_moon_cycle_button', label: 'Moon Cycle Button' },
      { key: 'hide_measure_button', label: 'Measure Tool Button' },
      { key: 'hide_ar_button', label: 'AR View Button' },
      { key: 'hide_solar_system_link', label: 'Solar System Link' },
      { key: 'hide_layer_controls', label: 'Layer Controls (Missions/Events/Objects)' },
      { key: 'hide_view_toggle', label: '3D/2D View Toggle' },
    ],
  },
  {
    group: 'MoonExplorer — Map',
    items: [
      { key: 'hide_sidebar', label: 'Sidebar (marker list)' },
      { key: 'hide_time_slider', label: 'Time Slider' },
      { key: 'hide_stats_bar', label: 'Stats Bar (bottom center)' },
      { key: 'hide_audio_player', label: 'Space Audio Player' },
      { key: 'hide_info_panel', label: 'Info Panel (marker details)' },
    ],
  },
  {
    group: 'Globe (3D View)',
    items: [
      { key: 'hide_globe_zoom_controls', label: 'Zoom / Reset Controls' },
      { key: 'hide_globe_compass', label: 'Compass' },
      { key: 'hide_sun_angle', label: 'Sun Angle Display' },
      { key: 'hide_guided_tour', label: 'Guided Tour Button' },
      { key: 'hide_globe_hint', label: 'Drag/Zoom Hint Text' },
    ],
  },
  {
    group: 'Solar System Page',
    items: [
      { key: 'hide_solar_system_page', label: 'Solar System Page (remove access)' },
      { key: 'hide_solar_planet_chips', label: 'Planet Chip List' },
      { key: 'hide_solar_controls_hint', label: 'Controls Hint Text' },
    ],
  },
];

export default function VisibilityPanel({ settings, onToggle }) {
  const isHidden = (key) => {
    const s = settings.find(s => s.key === key);
    return s?.value === 'true';
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Eye className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-heading font-bold">Visibility Controls</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">Hide or show any UI element across the app. Changes take effect immediately for all users.</p>
      </div>

      {VISIBILITY_ITEMS.map(({ group, items }) => (
        <div key={group} className="rounded-xl border border-border bg-card/40 overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
          </div>
          <div className="divide-y divide-border/50">
            {items.map(({ key, label }) => {
              const hidden = isHidden(key);
              return (
                <div key={key} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {hidden
                      ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      : <Eye className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    }
                    <span className={`text-sm font-body ${hidden ? 'text-muted-foreground/60 line-through' : 'text-foreground'}`}>
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-body px-1.5 py-0.5 rounded ${hidden ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
                      {hidden ? 'Hidden' : 'Visible'}
                    </span>
                    <Switch
                      checked={!hidden}
                      onCheckedChange={() => onToggle(key, hidden, 'visibility', label)}
                    />
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