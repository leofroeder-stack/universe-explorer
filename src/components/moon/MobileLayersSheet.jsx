import React from 'react';
import { createPortal } from 'react-dom';
import { X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LayerControls from './LayerControls';

export default function MobileLayersSheet({ isOpen, onClose, activeLayers, onToggleLayer, activeScientificLayers, onToggleScientificLayer }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && <>
        <motion.div
          key="backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          key="sheet"
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-card border-t border-border rounded-t-2xl"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span className="font-heading font-bold text-sm">Layers</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-4 pb-8">
            <LayerControls
              activeLayers={activeLayers}
              onToggleLayer={onToggleLayer}
              activeScientificLayers={activeScientificLayers}
              onToggleScientificLayer={onToggleScientificLayer}
            />
          </div>
        </motion.div>
      </>}
    </AnimatePresence>,
    document.body
  );
}