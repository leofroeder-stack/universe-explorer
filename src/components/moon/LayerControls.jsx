import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Rocket, Sparkles, Mountain } from 'lucide-react';
import { LAYER_TYPES, LAYER_COLORS } from './moonData';

const layers = [
  { key: LAYER_TYPES.MISSIONS, label: 'Missions', icon: Rocket, count: 10 },
  { key: LAYER_TYPES.EVENTS, label: 'Events', icon: Sparkles, count: 6 },
  { key: LAYER_TYPES.OBJECTS, label: 'Objects', icon: Mountain, count: 10 },
];

export default function LayerControls({ activeLayers, onToggleLayer }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {layers.map(({ key, label, icon: Icon, count }) => {
        const active = activeLayers.includes(key);
        const color = LAYER_COLORS[key];
        return (
          <button
            key={key}
            onClick={() => onToggleLayer(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
              active
                ? 'border-transparent shadow-lg'
                : 'border-border bg-card/50 opacity-60 hover:opacity-100'
            }`}
            style={active ? { backgroundColor: color + '20', borderColor: color + '40' } : {}}
          >
            <Icon className="w-4 h-4" style={active ? { color } : {}} />
            <span className="text-sm font-body font-medium" style={active ? { color } : {}}>
              {label}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={active ? { backgroundColor: color + '30', color } : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}