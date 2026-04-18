import React, { useState } from 'react';
import { Menu, X, Globe, Map, Moon, Ruler, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import LayerControls from './LayerControls';
import { useFeatureFlag } from '@/components/FeatureFlagProvider';
import { useAppSettings } from '@/components/AppSettingsProvider';

export default function MobileMenuDrawer({
  markers, selectedMarker, onSelectMarker,
  activeLayers, onToggleLayer,
  planet, onPlanetChange,
  viewMode, onViewModeChange,
  measureActive, onToggleMeasure,
  onOpenMoonCycle,
  onOpenAR,
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlag();
  const { isHidden } = useAppSettings();

  const close = () => setOpen(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4 text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border z-[700] flex flex-col lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                <span className="font-heading font-bold text-base">Menu</span>
                <button
                  onClick={close}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Planet Selector */}
                {!isHidden('hide_planet_selector') && (
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-2">Planet</p>
                    <div className="flex gap-2">
                      {[{ key: 'moon', emoji: '🌕', label: 'Moon' }, { key: 'mars', emoji: '🔴', label: 'Mars' }].map(({ key, emoji, label }) => (
                        <button
                          key={key}
                          onClick={() => { onPlanetChange(key); close(); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-body font-medium transition-all border ${
                            planet === key
                              ? 'bg-primary/20 border-primary/60 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>{emoji}</span> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Mode Toggle */}
                {!isHidden('hide_view_toggle') && (
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-2">View</p>
                    <div className="flex gap-2">
                      {[{ v: '3d', icon: Globe, label: '3D Globe' }, { v: '2d', icon: Map, label: '2D Map' }].map(({ v, icon: Icon, label }) => (
                        <button
                          key={v}
                          onClick={() => { onViewModeChange(v); close(); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-body font-medium transition-all border ${
                            viewMode === v
                              ? 'bg-primary/20 border-primary/60 text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-2">Actions</p>
                  <div className="flex flex-col gap-2">
                    {/* Moon Cycle */}
                    {planet === 'moon' && isEnabled('moon_cycle') && !isHidden('hide_moon_cycle_button') && (
                      <button
                        onClick={() => { onOpenMoonCycle(); close(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                      >
                        <Moon className="w-4 h-4" /> Moon Cycle Calendar
                      </button>
                    )}

                    {/* Measure */}
                    {isEnabled('measurements') && !isHidden('hide_measure_button') && (
                      <button
                        onClick={() => { onToggleMeasure(); close(); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-body transition-all ${
                          measureActive
                            ? 'bg-amber-500/20 border-amber-400/60 text-amber-400'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                        }`}
                      >
                        <Ruler className="w-4 h-4" /> {measureActive ? 'Measuring... (tap to stop)' : 'Measurement Tool'}
                      </button>
                    )}

                    {/* AR View */}
                    {planet === 'moon' && isEnabled('ar_view') && !isHidden('hide_ar_button') && (
                      <button
                        onClick={() => { onOpenAR(); close(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary/40 text-sm font-body text-primary hover:bg-primary/10 transition-all"
                      >
                        <Scan className="w-4 h-4" /> AR View
                      </button>
                    )}

                    {/* Solar System */}
                    {!isHidden('hide_solar_system_link') && (
                      <button
                        onClick={() => { navigate('/solar-system'); close(); }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                      >
                        <span>☀️</span> Solar System
                      </button>
                    )}
                  </div>
                </div>

                {/* Layer controls */}
                {!isHidden('hide_layer_controls') && (
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-2">Layers</p>
                    <LayerControls activeLayers={activeLayers} onToggleLayer={onToggleLayer} />
                  </div>
                )}

                {/* Markers list */}
                <div className="flex-1">
                  <Sidebar
                    markers={markers}
                    selectedMarker={selectedMarker}
                    onSelectMarker={(marker) => { onSelectMarker(marker); close(); }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}