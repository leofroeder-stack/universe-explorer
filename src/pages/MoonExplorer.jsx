import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Globe, Map, Scan, Moon, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Moon3DGlobe from '../components/moon/Moon3DGlobe';
import Moon2DMap from '../components/moon/Moon2DMap';
import LayerControls from '../components/moon/LayerControls';
import InfoPanel from '../components/moon/InfoPanel';
import Sidebar from '../components/moon/Sidebar';
import TimeSlider from '../components/moon/TimeSlider';
import MobileMenuDrawer from '../components/moon/MobileMenuDrawer';
import MoonPhaseOverlay from '../components/moon/MoonPhaseOverlay';
import ARView from '../components/moon/ARView';
import MeasurementTool from '../components/moon/MeasurementTool.jsx';
import MoonCycleCalendar from '../components/moon/MoonCycleCalendar.jsx';
import { missions, events, objects, LAYER_TYPES } from '../components/moon/moonData';
import { marsMissions, marsEvents, marsObjects } from '../components/moon/marsData';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeatureFlag } from '@/components/FeatureFlagProvider';

export default function MoonExplorer() {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlag();
  const [planet, setPlanet] = useState('moon'); // 'moon' | 'mars'
  const [viewMode, setViewMode] = useState('3d');
  const [arOpen, setArOpen] = useState(false);
  const [moonCycleOpen, setMoonCycleOpen] = useState(false);
  const [measureActive, setMeasureActive] = useState(false);
  const [measurePointA, setMeasurePointA] = useState(null);
  const [measurePointB, setMeasurePointB] = useState(null);
  const [activeLayers, setActiveLayers] = useState([
    LAYER_TYPES.MISSIONS, LAYER_TYPES.EVENTS, LAYER_TYPES.OBJECTS,
  ]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [timeFilteredMarkers, setTimeFilteredMarkers] = useState(null);
  const [sliderYear, setSliderYear] = useState(null);
  // Transition animation state
  const [transitioning, setTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState(null); // 'zoom-in' | 'flash' | null
  const transitionTargetRef = useRef(null); // '2d' or '3d'

  const toggleLayer = useCallback((layer) => {
    setActiveLayers(prev =>
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  }, []);

  const sourceMissions = planet === 'mars' ? marsMissions : missions;
  const sourceEvents = planet === 'mars' ? marsEvents : events;
  const sourceObjects = planet === 'mars' ? marsObjects : objects;

  const layerFilteredMarkers = useMemo(() => {
    const all = [];
    if (activeLayers.includes(LAYER_TYPES.MISSIONS)) all.push(...sourceMissions);
    if (activeLayers.includes(LAYER_TYPES.EVENTS)) all.push(...sourceEvents);
    if (activeLayers.includes(LAYER_TYPES.OBJECTS)) all.push(...sourceObjects);
    return all;
  }, [activeLayers, planet]);

  const displayedMarkers = useMemo(() => {
    if (timeFilteredMarkers === null) return layerFilteredMarkers;
    const ids = new Set(timeFilteredMarkers.map(m => m.id));
    return layerFilteredMarkers.filter(m => ids.has(m.id));
  }, [layerFilteredMarkers, timeFilteredMarkers]);

  const handleSelectMarker = useCallback((marker) => {
    setSelectedMarker(prev => prev?.id === marker.id ? null : marker);
  }, []);

  const handleTimeFilter = useCallback((filtered, year) => {
    setTimeFilteredMarkers(filtered);
    setSliderYear(year);
  }, []);

  // ─── Animated view switch ─────────────────────────────────────────────────
  const triggerViewTransition = useCallback((targetView) => {
    if (transitioning || viewMode === targetView) return;
    transitionTargetRef.current = targetView;
    setTransitioning(true);
    setTransitionPhase('zoom-in');

    // Phase 1: zoom-in flash (600ms), Phase 2: white flash (200ms), then switch
    setTimeout(() => {
      setTransitionPhase('flash');
      setTimeout(() => {
        setViewMode(targetView);
        if (targetView === '3d') setTimeFilteredMarkers(null);
        setTransitionPhase('fade-out');
        setTimeout(() => {
          setTransitioning(false);
          setTransitionPhase(null);
        }, 400);
      }, 200);
    }, 600);
  }, [transitioning, viewMode]);

  // Called by globe when zoom threshold crossed
  const handleAutoSwitch2D = useCallback(() => {
    triggerViewTransition('2d');
  }, [triggerViewTransition]);

  // Measurement handlers
  const handleMeasurePoint = useCallback((point) => {
    setMeasurePointA(prev => {
      if (!prev) return point;
      setMeasurePointB(point);
      return prev;
    });
  }, []);

  const handleMeasureClear = useCallback(() => {
    setMeasurePointA(null);
    setMeasurePointB(null);
  }, []);

  // Moon cycle: jump timeline to date (set time filter to that year)
  const handleJumpToDate = useCallback((date) => {
    const year = date.getFullYear();
    // Filter markers to those at/before the chosen year
    const filtered = layerFilteredMarkers.filter(m => {
      const match = m.date?.match(/\d{4}/);
      return match ? parseInt(match[0]) <= year : true;
    });
    setTimeFilteredMarkers(filtered);
    setSliderYear(year);
    triggerViewTransition('2d');
  }, [layerFilteredMarkers, triggerViewTransition]);

  const handleTabChange = (v) => {
    if (v !== viewMode) triggerViewTransition(v);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MobileMenuDrawer
              markers={displayedMarkers}
              selectedMarker={selectedMarker}
              onSelectMarker={handleSelectMarker}
              activeLayers={activeLayers}
              onToggleLayer={toggleLayer}
            />
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">Luna Atlas</h1>
              <p className="text-[11px] text-muted-foreground font-body">
                {planet === 'mars' ? 'Interactive Mars Explorer' : 'Interactive Moon Explorer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Planet Selector */}
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 border border-border">
              {[
                { key: 'moon', emoji: '🌕', label: 'Moon' },
                { key: 'mars', emoji: '🔴', label: 'Mars' },
              ].map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key !== planet) {
                      setPlanet(key);
                      setSelectedMarker(null);
                      setTimeFilteredMarkers(null);
                      setSliderYear(null);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                    planet === key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Moon Cycle button — moon only */}
            {planet === 'moon' && isEnabled('moon_cycle') && (
              <button
                onClick={() => setMoonCycleOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                title="Moon Cycle Calendar"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Moon Cycle</span>
              </button>
            )}

            {/* Measure button */}
            {isEnabled('measurements') && (
              <button
                onClick={() => { setMeasureActive(a => !a); handleMeasureClear(); }}
                title="Measurement Tool"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium border transition-all ${
                  measureActive
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-400'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Measure</span>
              </button>
            )}

            {/* AR View button — moon only */}
            {planet === 'moon' && isEnabled('ar_view') && (
              <button
                onClick={() => setArOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium border border-primary/40 text-primary hover:bg-primary/10 transition-all"
                title="AR View"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AR View</span>
              </button>
            )}

            <button
              onClick={() => navigate('/solar-system')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-body font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              ☀️ <span>Solar System</span>
            </button>
            <div className="hidden md:block">
              <LayerControls activeLayers={activeLayers} onToggleLayer={toggleLayer} />
            </div>
            <Tabs value={viewMode} onValueChange={handleTabChange}>
              <TabsList className="bg-secondary">
                <TabsTrigger value="3d" className="gap-1.5 text-xs">
                  <Globe className="w-3.5 h-3.5" /> 3D Globe
                </TabsTrigger>
                <TabsTrigger value="2d" className="gap-1.5 text-xs">
                  <Map className="w-3.5 h-3.5" /> 2D Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:block w-72 border-r border-border bg-card/30 flex-shrink-0 overflow-hidden">
          <Sidebar
            markers={displayedMarkers}
            selectedMarker={selectedMarker}
            onSelectMarker={handleSelectMarker}
          />
        </aside>

        <main className="flex-1 relative overflow-hidden">
          {/* Both views rendered, animated */}
          <AnimatePresence mode="wait">
            {viewMode === '3d' ? (
              <motion.div
                key="globe"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.08 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <Moon3DGlobe
                  key={planet}
                  markers={displayedMarkers}
                  selectedMarker={selectedMarker}
                  onSelectMarker={measureActive ? handleMeasurePoint : handleSelectMarker}
                  onAutoSwitch2D={handleAutoSwitch2D}
                  planet={planet}
                />
              </motion.div>
            ) : (
              <motion.div
                key="map"
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <Moon2DMap
                  markers={displayedMarkers}
                  selectedMarker={selectedMarker}
                  onSelectMarker={handleSelectMarker}
                  onSwitchTo3D={() => triggerViewTransition('3d')}
                  planet={planet}
                  measureActive={measureActive}
                  measurePointA={measurePointA}
                  measurePointB={measurePointB}
                  onMeasurePoint={handleMeasurePoint}
                />
                {/* Time slider */}
                <TimeSlider
                  allMarkers={layerFilteredMarkers}
                  onFilteredMarkersChange={handleTimeFilter}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transition overlay — zoom flash effect */}
          <AnimatePresence>
            {transitionPhase === 'zoom-in' && (
              <motion.div
                key="t-zoom"
                className="absolute inset-0 pointer-events-none z-50"
                style={{ background: 'radial-gradient(circle at center, rgba(100,130,200,0.0) 0%, rgba(0,0,0,0) 100%)' }}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1.6, background: 'radial-gradient(circle at center, rgba(150,170,220,0.25) 0%, rgba(0,0,20,0.6) 100%)' }}
                transition={{ duration: 0.6, ease: 'easeIn' }}
              />
            )}
            {transitionPhase === 'flash' && (
              <motion.div
                key="t-flash"
                className="absolute inset-0 pointer-events-none z-50 bg-white"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
            {transitionPhase === 'fade-out' && (
              <motion.div
                key="t-fadeout"
                className="absolute inset-0 pointer-events-none z-50"
                initial={{ opacity: 0.5, backdropFilter: 'blur(8px)' }}
                animate={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>

          {/* Info panel */}
          <InfoPanel marker={selectedMarker} onClose={() => setSelectedMarker(null)} />

          {/* Measurement result card */}
          {measureActive && isEnabled('measurements') && (
            <div className="absolute top-4 right-4 z-[600]">
              <MeasurementTool
                isActive={measureActive}
                onToggle={() => { setMeasureActive(false); handleMeasureClear(); }}
                pointA={measurePointA}
                pointB={measurePointB}
                onClear={handleMeasureClear}
              />
            </div>
          )}

          {/* AR View */}
          {isEnabled('ar_view') && (
            <AnimatePresence>
              {arOpen && (
                <ARView
                  markers={displayedMarkers}
                  onClose={() => setArOpen(false)}
                  onSelectMarker={handleSelectMarker}
                />
              )}
            </AnimatePresence>
          )}

          {/* Moon Cycle Calendar */}
          {isEnabled('moon_cycle') && (
            <MoonCycleCalendar
              isOpen={moonCycleOpen}
              onClose={() => setMoonCycleOpen(false)}
              onJumpToDate={handleJumpToDate}
            />
          )}

          {/* Stats bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-card/90 backdrop-blur-xl rounded-full border border-border shadow-xl z-[400]">
            <span className="text-[11px] text-muted-foreground font-body">
              Showing <span className="text-foreground font-medium">{displayedMarkers.length}</span> locations
            </span>
            <div className="w-px h-3 bg-border" />
            {sliderYear && viewMode === '2d' ? (
              <span className="text-[11px] text-primary font-body font-medium">Up to {sliderYear}</span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-body">
                {activeLayers.length} layer{activeLayers.length !== 1 ? 's' : ''} active
              </span>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}