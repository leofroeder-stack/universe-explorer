import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Map } from 'lucide-react';
import * as THREE from 'three';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PLANET_BODIES, PLANET_INFO, BODY_TYPES, BODY_COLORS } from '../components/solar/solarData';
import PlanetGlobe from '../components/solar/PlanetGlobe';
import PlanetBodyPanel from '../components/solar/PlanetBodyPanel';
import PlanetBodyList from '../components/solar/PlanetBodyList';

export default function PlanetExplorer() {
  const navigate = useNavigate();
  const { planetName } = useParams();
  const planet = PLANET_INFO[planetName];
  const bodies = PLANET_BODIES[planetName] || [];

  const [selectedBody, setSelectedBody] = useState(null);
  const [viewMode, setViewMode] = useState('3d');
  const [activeTypes, setActiveTypes] = useState([BODY_TYPES.MOON, BODY_TYPES.RING, BODY_TYPES.OBJECT]);

  const toggleType = useCallback((type) => {
    setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }, []);

  const filteredBodies = useMemo(() =>
    bodies.filter(b => activeTypes.includes(b.type)),
    [bodies, activeTypes]
  );

  const handleSelect = useCallback((body) => {
    setSelectedBody(prev => prev?.id === body.id ? null : body);
  }, []);

  if (!planet) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Planet not found.</p>
          <button onClick={() => navigate('/solar-system')} className="mt-4 text-primary underline text-sm">Back to Solar System</button>
        </div>
      </div>
    );
  }

  const typeCounts = {
    [BODY_TYPES.MOON]: bodies.filter(b => b.type === BODY_TYPES.MOON).length,
    [BODY_TYPES.RING]: bodies.filter(b => b.type === BODY_TYPES.RING).length,
    [BODY_TYPES.OBJECT]: bodies.filter(b => b.type === BODY_TYPES.OBJECT).length,
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/solar-system')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${planet.color}20` }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: planet.color }} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">{planet.name} Explorer</h1>
              <p className="text-[11px] text-muted-foreground font-body">{bodies.length} known bodies</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Type filters */}
            <div className="hidden md:flex items-center gap-1.5">
              {[
                { type: BODY_TYPES.MOON, label: '🌙 Moons', count: typeCounts[BODY_TYPES.MOON] },
                { type: BODY_TYPES.RING, label: '💍 Rings', count: typeCounts[BODY_TYPES.RING] },
                { type: BODY_TYPES.OBJECT, label: '🪐 Objects', count: typeCounts[BODY_TYPES.OBJECT] },
              ].filter(f => f.count > 0).map(({ type, label, count }) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium border transition-all"
                  style={{
                    borderColor: activeTypes.includes(type) ? BODY_COLORS[type] : 'hsl(var(--border))',
                    color: activeTypes.includes(type) ? BODY_COLORS[type] : 'hsl(var(--muted-foreground))',
                    background: activeTypes.includes(type) ? `${BODY_COLORS[type]}15` : 'transparent',
                  }}
                >
                  {label} <span className="opacity-60">({count})</span>
                </button>
              ))}
            </div>
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-secondary">
                <TabsTrigger value="3d" className="gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5" /> 3D
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5 text-xs">
                  <Map className="w-3.5 h-3.5" /> List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 border-r border-border bg-card/30 flex-shrink-0 overflow-hidden">
          <PlanetBodyList
            bodies={filteredBodies}
            selectedBody={selectedBody}
            onSelect={handleSelect}
          />
        </aside>

        <main className="flex-1 relative overflow-hidden">
          {viewMode === '3d' ? (
            <PlanetGlobe
              planet={planet}
              bodies={filteredBodies}
              selectedBody={selectedBody}
              onSelectBody={handleSelect}
              vrActions={Object.entries(typeCounts).filter(([, count]) => count > 0).map(([type]) => ({ label: `${activeTypes.includes(type) ? 'On' : 'Off'}: ${type}`, onSelect: () => toggleType(type) }))}
            />
          ) : (
            <div className="w-full h-full overflow-auto p-4">
              <div className="max-w-2xl mx-auto space-y-3">
                {filteredBodies.map(body => (
                  <button
                    key={body.id}
                    onClick={() => handleSelect(body)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedBody?.id === body.id
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border bg-card/50 hover:bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: BODY_COLORS[body.type], boxShadow: `0 0 6px ${BODY_COLORS[body.type]}60` }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body font-semibold text-sm text-foreground">{body.name}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
                            style={{ background: `${BODY_COLORS[body.type]}20`, color: BODY_COLORS[body.type] }}
                          >
                            {body.type}
                          </span>
                        </div>
                        {body.date && <p className="text-[11px] text-muted-foreground mt-0.5">{body.date}</p>}
                        <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{body.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredBodies.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No items match the active filters.</p>
                )}
              </div>
            </div>
          )}

          {/* Info panel */}
          <PlanetBodyPanel body={selectedBody} planet={planet} onClose={() => setSelectedBody(null)} />

          {/* Stats bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-card/90 backdrop-blur-xl rounded-full border border-border shadow-xl z-[400]">
            <span className="text-[11px] text-muted-foreground font-body">
              Showing <span className="text-foreground font-medium">{filteredBodies.length}</span> bodies
            </span>
            <div className="w-px h-3 bg-border" />
            <span className="text-[11px] text-muted-foreground font-body">{activeTypes.length} type{activeTypes.length !== 1 ? 's' : ''} active</span>
          </div>
        </main>
      </div>
    </div>
  );
}