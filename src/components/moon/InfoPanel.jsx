import React from 'react';
import { X, MapPin, Calendar, Users, Flag, Ruler, ExternalLink } from 'lucide-react';
import { LAYER_COLORS } from './moonData';
import { motion, AnimatePresence } from 'framer-motion';

export default function InfoPanel({ marker, onClose }) {
  const color = marker ? LAYER_COLORS[marker.type] : null;
  const typeLabel = marker ? marker.type.charAt(0).toUpperCase() + marker.type.slice(1) : '';

  const nasaSearchUrl = marker
    ? `https://www.nasa.gov/search/?q=${encodeURIComponent(marker.name)}`
    : '#';

  return (
    <AnimatePresence>
      {marker && (
        <motion.div
          key={marker.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-[1000]"
        >
          <div className="p-1" style={{ background: `linear-gradient(135deg, ${color}25, transparent)` }}>
            <div className="bg-card/90 rounded-xl p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <span
                    className="text-[10px] font-body font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: color + '22' }}
                  >
                    {typeLabel}
                  </span>
                  <h3 className="font-heading font-bold text-base mt-1.5 text-foreground leading-tight">
                    {marker.name}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-foreground/70 font-body leading-relaxed mb-4">
                {marker.description}
              </p>

              {/* Metadata */}
              <div className="space-y-2">
                {marker.date && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground/70 font-body">{marker.date}</span>
                  </div>
                )}
                {marker.crew && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-foreground/70 font-body leading-snug">{marker.crew}</span>
                  </div>
                )}
                {marker.country && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Flag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground/70 font-body">{marker.country}</span>
                  </div>
                )}
                {marker.diameter && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Ruler className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground/70 font-body">{marker.diameter}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-foreground/70 font-body">
                    {Math.abs(marker.lat).toFixed(2)}°{marker.lat >= 0 ? 'N' : 'S'} {Math.abs(marker.lng).toFixed(2)}°{marker.lng >= 0 ? 'E' : 'W'}
                  </span>
                </div>
              </div>

              {/* NASA source link */}
              <div className="mt-4 pt-3 border-t border-border/50">
                <a
                  href={nasaSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
                >
                  <img
                    src="https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo.svg"
                    alt="NASA"
                    className="h-4 w-auto opacity-60 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="font-body">Search on NASA.gov</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}