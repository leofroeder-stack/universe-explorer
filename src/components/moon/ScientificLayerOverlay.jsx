import React from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { SCIENTIFIC_LAYER_META } from './scientificLayers';

// Interpolates through the gradient stops by value [0..1]
function valueToColor(gradient, value) {
  const n = gradient.length - 1;
  const pos = Math.max(0, Math.min(1, value)) * n;
  const lo = Math.floor(pos);
  const hi = Math.min(n, lo + 1);
  const t = pos - lo;
  // Parse hex colors and lerp
  const parse = (hex) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const [r1,g1,b1] = parse(gradient[lo]);
  const [r2,g2,b2] = parse(gradient[hi]);
  const r = Math.round(r1 + (r2-r1)*t);
  const g = Math.round(g1 + (g2-g1)*t);
  const b = Math.round(b1 + (b2-b1)*t);
  return `rgb(${r},${g},${b})`;
}

export default function ScientificLayerOverlay({ activeScientificLayers }) {
  if (!activeScientificLayers || activeScientificLayers.length === 0) return null;

  return (
    <>
      {activeScientificLayers.map(layerKey => {
        const meta = SCIENTIFIC_LAYER_META[layerKey];
        if (!meta) return null;
        return meta.regions.map((region, idx) => {
          const color = valueToColor(meta.gradient, region.value);
          return (
            <CircleMarker
              key={`${layerKey}-${idx}`}
              center={[region.lat, region.lng]}
              radius={region.r * 3}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.38,
                weight: 1,
                opacity: 0.55,
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-body">
                  <div className="font-semibold">{region.label}</div>
                  <div className="opacity-70">{meta.label}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        });
      })}
    </>
  );
}

// Legend bar shown as absolute overlay on the map
export function ScientificLayerLegend({ activeScientificLayers }) {
  if (!activeScientificLayers || activeScientificLayers.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[600] flex flex-col gap-2 pointer-events-none">
      {activeScientificLayers.map(layerKey => {
        const meta = SCIENTIFIC_LAYER_META[layerKey];
        if (!meta) return null;
        const gradientCss = `linear-gradient(to right, ${meta.gradient.join(', ')})`;
        return (
          <div
            key={layerKey}
            className="flex flex-col gap-1 px-3 py-2 rounded-xl border border-white/10 shadow-lg"
            style={{ background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(8px)', minWidth: 220 }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-[11px] font-body font-semibold text-white/90">{meta.label}</span>
              <span className="text-[10px] text-white/40 font-body ml-auto">{meta.unit}</span>
            </div>
            <div className="h-2.5 rounded-full w-full" style={{ background: gradientCss }} />
            <div className="flex justify-between mt-0.5">
              {meta.gradientLabels.map((lbl, i) => (
                <span key={i} className="text-[9px] text-white/50 font-body">{lbl}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}