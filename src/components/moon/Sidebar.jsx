import React, { useState, useMemo } from 'react';
import { ChevronDown, Rocket, Sparkles, Mountain, Moon, Search, X } from 'lucide-react';
import { LAYER_COLORS } from './moonData';
import { ScrollArea } from "@/components/ui/scroll-area";
import MoonPhase from './MoonPhase';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { key: 'phase', label: 'Moon Phase', icon: Moon, color: '#94a3b8' },
  { key: 'missions', label: 'Missions', icon: Rocket, color: LAYER_COLORS.missions },
  { key: 'events', label: 'Events', icon: Sparkles, color: LAYER_COLORS.events },
  { key: 'objects', label: 'Objects', icon: Mountain, color: LAYER_COLORS.objects },
];

function MarkerItem({ marker, isActive, onSelect }) {
  const color = LAYER_COLORS[marker.type];
  return (
    <button
      onClick={() => onSelect(marker)}
      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2.5 group ${
        isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
      }`}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
        style={{ backgroundColor: color, boxShadow: isActive ? `0 0 8px ${color}80` : 'none' }}
      />
      <div className="min-w-0">
        <p className="text-sm font-body font-medium text-foreground truncate">{marker.name}</p>
        {marker.date && (
          <p className="text-[10px] text-muted-foreground truncate">{marker.date}</p>
        )}
      </div>
    </button>
  );
}

function SectionHeader({ section, isOpen, onToggle, count }) {
  const Icon = section.icon;
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
        isOpen ? 'bg-secondary' : 'hover:bg-secondary/40'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: section.color + '20' }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: section.color }} />
        </div>
        <span className="text-sm font-body font-semibold text-foreground">{section.label}</span>
        {count !== undefined && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: section.color + '20', color: section.color }}
          >
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        className="w-4 h-4 text-muted-foreground transition-transform duration-200"
        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </button>
  );
}

export default function Sidebar({ markers, selectedMarker, onSelectMarker }) {
  const [openSections, setOpenSections] = useState({ phase: false, missions: true, events: false, objects: false });
  const [search, setSearch] = useState('');
  const [crewFilter, setCrewFilter] = useState(null); // null | 'crewed' | 'uncrewed'

  const toggle = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredMarkers = useMemo(() => {
    let result = markers;
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(m =>
        m.name?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.country?.toLowerCase().includes(q) ||
        m.crew?.toLowerCase().includes(q) ||
        m.date?.toLowerCase().includes(q)
      );
    }
    if (crewFilter === 'crewed') {
      result = result.filter(m => m.crew && m.crew !== 'Uncrewed');
    } else if (crewFilter === 'uncrewed') {
      result = result.filter(m => m.crew === 'Uncrewed');
    }
    return result;
  }, [markers, search, crewFilter]);

  // Auto-expand sections that have search results
  const grouped = useMemo(() => ({
    missions: filteredMarkers.filter(m => m.type === 'missions'),
    events: filteredMarkers.filter(m => m.type === 'events'),
    objects: filteredMarkers.filter(m => m.type === 'objects'),
  }), [filteredMarkers]);

  const isSearchActive = search.trim() !== '' || crewFilter !== null;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, country…"
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-8 py-2 text-xs font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Crew quick-filter toggles */}
        <div className="flex gap-1.5">
          {[
            { key: 'crewed', label: '👨‍🚀 Crewed' },
            { key: 'uncrewed', label: '🤖 Uncrewed' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCrewFilter(prev => prev === key ? null : key)}
              className={`flex-1 text-[11px] font-body font-medium py-1.5 rounded-lg border transition-all ${
                crewFilter === key
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search result count */}
        {isSearchActive && (
          <p className="text-[10px] text-muted-foreground font-body px-1">
            {filteredMarkers.length} result{filteredMarkers.length !== 1 ? 's' : ''} found
          </p>
        )}

        <div className="space-y-1.5">
        {SECTIONS.map(section => {
          const isOpen = isSearchActive && section.key !== 'phase' ? true : openSections[section.key];
          const items = section.key !== 'phase' ? grouped[section.key] : null;
          const count = items?.length;

          return (
            <div key={section.key} className="rounded-xl overflow-hidden border border-border/50">
              <SectionHeader
                section={section}
                isOpen={isOpen}
                onToggle={() => toggle(section.key)}
                count={count}
              />
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="border-t border-border/50">
                      {section.key === 'phase' ? (
                        <MoonPhase />
                      ) : (
                        <div className="p-2 space-y-0.5">
                          {items && items.length > 0 ? items.map(marker => (
                            <MarkerItem
                              key={marker.id}
                              marker={marker}
                              isActive={selectedMarker?.id === marker.id}
                              onSelect={onSelectMarker}
                            />
                          )) : (
                            <p className="text-xs text-muted-foreground text-center py-3 font-body">
                              No items visible
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        </div>
      </div>
    </ScrollArea>
  );
}