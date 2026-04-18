import React from 'react';
import { Rocket, Sparkles, Mountain, Layers, Magnet, FlaskConical, Thermometer } from 'lucide-react';
import { LAYER_TYPES, LAYER_COLORS } from './moonData';
import { SCIENTIFIC_LAYER_TYPES, SCIENTIFIC_LAYER_META } from './scientificLayers';

const BASE_LAYERS = [
  { key: LAYER_TYPES.MISSIONS, label: 'Missions', icon: Rocket, count: 10, color: LAYER_COLORS.missions },
  { key: LAYER_TYPES.EVENTS, label: 'Events', icon: Sparkles, count: 6, color: LAYER_COLORS.events },
  { key: LAYER_TYPES.OBJECTS, label: 'Objects', icon: Mountain, count: 10, color: LAYER_COLORS.objects },
];

const SCIENTIFIC_LAYERS = [
  { key: SCIENTIFIC_LAYER_TYPES.TOPOGRAPHY, label: 'Topography', icon: Layers, color: SCIENTIFIC_LAYER_META.topography.color },
  { key: SCIENTIFIC_LAYER_TYPES.GRAVITY, label: 'Gravity', icon: Magnet, color: SCIENTIFIC_LAYER_META.gravity.color },
  { key: SCIENTIFIC_LAYER_TYPES.MINERALS, label: 'Minerals', icon: FlaskConical, color: SCIENTIFIC_LAYER_META.minerals.color },
  { key: SCIENTIFIC_LAYER_TYPES.TEMPERATURE, label: 'Temperature', icon: Thermometer, color: SCIENTIFIC_LAYER_META.temperature.color },
];

export default function LayerControls({ activeLayers, onToggleLayer, activeScientificLayers = [], onToggleScientificLayer }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Base layers */}
      <div className="flex flex-wrap items-center gap-2">
        {BASE_LAYERS.map(({ key, label, icon: Icon, count, color }) => {
          const active = activeLayers.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                active ? 'border-transparent shadow-md' : 'border-border bg-card/50 opacity-60 hover:opacity-100'
              }`}
              style={active ? { backgroundColor: color + '20', borderColor: color + '40' } : {}}
            >
              <Icon className="w-3.5 h-3.5" style={active ? { color } : {}} />
              <span className="text-xs font-body font-medium" style={active ? { color } : {}}>{label}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={active ? { backgroundColor: color + '30', color } : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
              >{count}</span>
            </button>
          );
        })}
      </div>

      {/* Scientific overlay layers */}
      {onToggleScientificLayer && (
        <div className="flex flex-wrap items-center gap-2">
          {SCIENTIFIC_LAYERS.map(({ key, label, icon: Icon, color }) => {
            const active = activeScientificLayers.includes(key);
            return (
              <button
                key={key}
                onClick={() => onToggleScientificLayer(key)}
                title={SCIENTIFIC_LAYER_META[key]?.description}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  active ? 'border-transparent shadow-md' : 'border-border bg-card/50 opacity-60 hover:opacity-100'
                }`}
                style={active ? { backgroundColor: color + '22', borderColor: color + '50' } : {}}
              >
                <Icon className="w-3.5 h-3.5" style={active ? { color } : {}} />
                <span className="text-xs font-body font-medium" style={active ? { color } : {}}>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}