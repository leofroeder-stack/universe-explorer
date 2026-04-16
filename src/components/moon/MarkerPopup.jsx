import React from 'react';
import { LAYER_COLORS } from './moonData';

export default function MarkerPopup({ marker }) {
  const color = LAYER_COLORS[marker.type];

  return (
    <div className="min-w-[220px] max-w-[280px] p-1">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-heading font-semibold text-sm" style={{ color }}>
          {marker.name}
        </h3>
      </div>

      {marker.date && (
        <p className="text-xs text-muted-foreground mb-1.5 font-body">
          {marker.date}
        </p>
      )}

      <p className="text-xs leading-relaxed font-body text-foreground/80 mb-2">
        {marker.description}
      </p>

      {marker.crew && (
        <div className="text-xs">
          <span className="text-muted-foreground">Crew: </span>
          <span className="text-foreground/70">{marker.crew}</span>
        </div>
      )}

      {marker.country && (
        <div className="text-xs mt-1">
          <span className="text-muted-foreground">Country: </span>
          <span className="text-foreground/70">{marker.country}</span>
        </div>
      )}

      {marker.diameter && (
        <div className="text-xs mt-1">
          <span className="text-muted-foreground">Size: </span>
          <span className="text-foreground/70">{marker.diameter}</span>
        </div>
      )}

      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground font-body">
          {marker.lat.toFixed(2)}° {marker.lat >= 0 ? 'N' : 'S'}, {marker.lng.toFixed(2)}° {marker.lng >= 0 ? 'E' : 'W'}
        </span>
      </div>
    </div>
  );
}