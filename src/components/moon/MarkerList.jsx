import React from 'react';
import { LAYER_COLORS } from './moonData';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MarkerList({ markers, selectedMarker, onSelectMarker }) {
  const grouped = {
    missions: markers.filter(m => m.type === 'missions'),
    events: markers.filter(m => m.type === 'events'),
    objects: markers.filter(m => m.type === 'objects'),
  };

  const labels = { missions: 'Missions', events: 'Events', objects: 'Objects' };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {Object.entries(grouped).map(([type, items]) =>
          items.length > 0 && (
            <div key={type}>
              <h4
                className="text-[10px] font-heading font-semibold uppercase tracking-widest mb-2 px-1"
                style={{ color: LAYER_COLORS[type] }}
              >
                {labels[type]}
              </h4>
              <div className="space-y-1">
                {items.map(marker => {
                  const isActive = selectedMarker?.id === marker.id;
                  const color = LAYER_COLORS[marker.type];
                  return (
                    <button
                      key={marker.id}
                      onClick={() => onSelectMarker(marker)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2.5 group ${
                        isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                        style={{ backgroundColor: color, boxShadow: isActive ? `0 0 8px ${color}80` : 'none' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-body font-medium text-foreground truncate">
                          {marker.name}
                        </p>
                        {marker.date && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {marker.date}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </ScrollArea>
  );
}