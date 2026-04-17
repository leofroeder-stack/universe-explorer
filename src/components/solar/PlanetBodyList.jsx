import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { BODY_COLORS } from './solarData';

export default function PlanetBodyList({ bodies, selectedBody, onSelect }) {
  const grouped = {
    moon: bodies.filter(b => b.type === 'moon'),
    ring: bodies.filter(b => b.type === 'ring'),
    object: bodies.filter(b => b.type === 'object'),
  };

  const LABELS = { moon: '🌙 Moons', ring: '💍 Rings', object: '🪐 Objects' };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {Object.entries(grouped).map(([type, items]) => {
          if (items.length === 0) return null;
          const color = BODY_COLORS[type];
          return (
            <div key={type}>
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-xs font-body font-semibold text-foreground">{LABELS[type]}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: `${color}20`, color }}
                >
                  {items.length}
                </span>
              </div>
              <div className="space-y-0.5">
                {items.map(body => (
                  <button
                    key={body.id}
                    onClick={() => onSelect(body)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 flex items-center gap-2.5 group ${
                      selectedBody?.id === body.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                      style={{
                        backgroundColor: color,
                        boxShadow: selectedBody?.id === body.id ? `0 0 8px ${color}80` : 'none',
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-foreground truncate">{body.name}</p>
                      {body.date && (
                        <p className="text-[10px] text-muted-foreground truncate">{body.date}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {bodies.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No bodies match the active filters.</p>
        )}
      </div>
    </ScrollArea>
  );
}