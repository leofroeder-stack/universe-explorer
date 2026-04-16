import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import LayerControls from './LayerControls';

export default function MobileMenuDrawer({ markers, selectedMarker, onSelectMarker, activeLayers, onToggleLayer }) {
  const [open, setOpen] = useState(false);

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

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
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
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Layer controls */}
              <div className="px-3 py-3 border-b border-border flex-shrink-0">
                <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-2 px-1">Layers</p>
                <LayerControls activeLayers={activeLayers} onToggleLayer={onToggleLayer} />
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-hidden">
                <Sidebar
                  markers={markers}
                  selectedMarker={selectedMarker}
                  onSelectMarker={(marker) => {
                    onSelectMarker(marker);
                    setOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}