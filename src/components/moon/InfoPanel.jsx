import React from 'react';
import { X, MapPin, Calendar, Users, Flag, Ruler } from 'lucide-react';
import { LAYER_COLORS } from './moonData';
import { motion, AnimatePresence } from 'framer-motion';

export default function InfoPanel({ marker, onClose }) {
  if (!marker) return null;

  const color = LAYER_COLORS[marker.type];
  const typeLabel = marker.type.charAt(0).toUpperCase() + marker.type.slice(1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-[1000]"
      >
        <div className="p-1" style={{ background: `linear-gradient(135deg, ${color}20, transparent)` }}>
          <div className="bg-card rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span
                  className="text-[10px] font-body font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color, backgroundColor: color + '20' }}
                >
                  {typeLabel}
                </span>
                <h3 className="font-heading font-bold text-lg mt-2 text-foreground">
                  {marker.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <p className="text-sm text-foreground/70 font-body leading-relaxed mb-4">
              {marker.description}
            </p>

            <div className="space-y-2.5">
              {marker.date && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground/70 font-body">{marker.date}</span>
                </div>
              )}
              {marker.crew && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground/70 font-body">{marker.crew}</span>
                </div>
              )}
              {marker.country && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground/70 font-body">{marker.country}</span>
                </div>
              )}
              {marker.diameter && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground/70 font-body">{marker.diameter}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-foreground/70 font-body">
                  {Math.abs(marker.lat).toFixed(2)}° {marker.lat >= 0 ? 'N' : 'S'}, {Math.abs(marker.lng).toFixed(2)}° {marker.lng >= 0 ? 'E' : 'W'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}