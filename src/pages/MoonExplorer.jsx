import React, { useState, useMemo, useCallback } from 'react';
import { Globe, Map } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Moon3DGlobe from '../components/moon/Moon3DGlobe';
import Moon2DMap from '../components/moon/Moon2DMap';
import LayerControls from '../components/moon/LayerControls';
import InfoPanel from '../components/moon/InfoPanel';
import MarkerList from '../components/moon/MarkerList';
import { missions, events, objects, LAYER_TYPES } from '../components/moon/moonData';

export default function MoonExplorer() {
  const [viewMode, setViewMode] = useState('3d');
  const [activeLayers, setActiveLayers] = useState([
    LAYER_TYPES.MISSIONS,
    LAYER_TYPES.EVENTS,
    LAYER_TYPES.OBJECTS,
  ]);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const toggleLayer = useCallback((layer) => {
    setActiveLayers(prev =>
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  }, []);

  const filteredMarkers = useMemo(() => {
    const all = [];
    if (activeLayers.includes(LAYER_TYPES.MISSIONS)) all.push(...missions);
    if (activeLayers.includes(LAYER_TYPES.EVENTS)) all.push(...events);
    if (activeLayers.includes(LAYER_TYPES.OBJECTS)) all.push(...objects);
    return all;
  }, [activeLayers]);

  const handleSelectMarker = useCallback((marker) => {
    setSelectedMarker(prev => prev?.id === marker.id ? null : marker);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">Luna Atlas</h1>
              <p className="text-[11px] text-muted-foreground font-body">Interactive Moon Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <LayerControls activeLayers={activeLayers} onToggleLayer={toggleLayer} />
            </div>
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-secondary">
                <TabsTrigger value="3d" className="gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5" />
                  3D Globe
                </TabsTrigger>
                <TabsTrigger value="2d" className="gap-1.5 text-xs">
                  <Map className="w-3.5 h-3.5" />
                  2D Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Mobile layer controls */}
        <div className="md:hidden px-4 pb-3">
          <LayerControls activeLayers={activeLayers} onToggleLayer={toggleLayer} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - marker list */}
        <aside className="hidden lg:block w-72 border-r border-border bg-card/30 flex-shrink-0">
          <MarkerList
            markers={filteredMarkers}
            selectedMarker={selectedMarker}
            onSelectMarker={handleSelectMarker}
          />
        </aside>

        {/* Map area */}
        <main className="flex-1 relative">
          {viewMode === '3d' ? (
            <Moon3DGlobe
              markers={filteredMarkers}
              selectedMarker={selectedMarker}
              onSelectMarker={handleSelectMarker}
            />
          ) : (
            <Moon2DMap
              markers={filteredMarkers}
              selectedMarker={selectedMarker}
              onSelectMarker={handleSelectMarker}
            />
          )}

          {/* Info panel overlay */}
          <InfoPanel
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
          />

          {/* Stats bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-card/90 backdrop-blur-xl rounded-full border border-border shadow-xl">
            <span className="text-[11px] text-muted-foreground font-body">
              Showing <span className="text-foreground font-medium">{filteredMarkers.length}</span> locations
            </span>
            <div className="w-px h-3 bg-border" />
            <span className="text-[11px] text-muted-foreground font-body">
              {activeLayers.length} layer{activeLayers.length !== 1 ? 's' : ''} active
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}