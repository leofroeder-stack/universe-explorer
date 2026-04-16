import React from 'react';
import { X, MapPin, Calendar, Users, Flag, Ruler, ExternalLink } from 'lucide-react';
import { LAYER_COLORS } from './moonData';
import { motion, AnimatePresence } from 'framer-motion';

const NASA_URLS = {
  missions: 'https://www.nasa.gov/missions/',
  events: 'https://lunar.gsfc.nasa.gov/',
  objects: 'https://www.nasa.gov/moon/',
};

export default function InfoPanel({ marker, onClose }) {
  if (!marker) return null;

  const color = LAYER_COLORS[marker.type];
  const typeLabel = marker.type.charAt(0).toUpperCase() + marker.type.slice(1, -1); // 'Mission', 'Event', 'Object'
  const nasaUrl = NASA_URLS[marker.type];

  return (
    <AnimatePresence>
      <motion.div
        key={marker.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute top-4 right-4 w-80 rounded-2xl shadow-2xl overflow-hidden z-[1000]"
        style={{ border: `1px solid ${color}30` }}
      >
        {/* Gradient header strip */}
        <div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${color}18 0%, hsl(var(--card)) 60%)`, backgroundColor: 'hsl(var(--card))' }}>
          <div className="flex items-start justify-between">
            <div>
              <span
                className="text-[10px] font-body font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ color, backgroundColor: color + '22' }}
              >
                {typeLabel}
              </span>
              <h3 className="font-heading font-bold text-base mt-2 text-foreground leading-snug">
                {marker.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors ml-2 flex-shrink-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 bg-card/95 backdrop-blur-xl space-y-4">
          <p className="text-sm text-foreground/70 font-body leading-relaxed">
            {marker.description}
          </p>

          <div className="space-y-2 text-sm">
            {marker.date && (
              <div className="flex items-start gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground/70 font-body">{marker.date}</span>
              </div>
            )}
            {marker.crew && (
              <div className="flex items-start gap-2.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground/70 font-body">{marker.crew}</span>
              </div>
            )}
            {marker.country && (
              <div className="flex items-start gap-2.5">
                <Flag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground/70 font-body">{marker.country}</span>
              </div>
            )}
            {marker.diameter && (
              <div className="flex items-start gap-2.5">
                <Ruler className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-foreground/70 font-body">{marker.diameter}</span>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-foreground/60 font-body text-xs">
                {Math.abs(marker.lat).toFixed(2)}° {marker.lat >= 0 ? 'N' : 'S'}, {Math.abs(marker.lng).toFixed(2)}° {marker.lng >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </div>

          {/* NASA source link */}
          <div className="pt-2 border-t border-border/50">
            <a
              href={nasaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-body font-medium hover:opacity-80 transition-opacity"
              style={{ color }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Source: NASA.gov
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}