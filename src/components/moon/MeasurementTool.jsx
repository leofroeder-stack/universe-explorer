import React from 'react';
import { Ruler, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOON_RADIUS_KM = 1737.4;

export function haversineKm(lat1, lng1, lat2, lng2, radius = MOON_RADIUS_KM) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.asin(Math.sqrt(a));
}

export default function MeasurementTool({ isActive, onToggle, pointA, pointB, onClear }) {
  const distance =
    pointA && pointB
      ? haversineKm(pointA.lat, pointA.lng, pointB.lat, pointB.lng)
      : null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.18 }}
          className="w-72 rounded-2xl border border-amber-400/30 bg-card/95 backdrop-blur-xl shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-400" />
              <span className="font-heading font-semibold text-sm text-foreground">Distance Measurement</span>
            </div>
            <button onClick={() => { onClear(); onToggle(); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground font-body mb-3">
            {!pointA ? 'Click a landing site or crater to set Point A' :
             !pointB ? 'Now click a second location for Point B' :
             'Geodesic distance calculated'}
          </p>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-heading font-bold text-blue-400">A</span>
            </div>
            <span className="text-xs font-body text-foreground truncate">
              {pointA ? `${pointA.name} (${pointA.lat.toFixed(2)}°, ${pointA.lng.toFixed(2)}°)` : '—'}
            </span>
          </div>

          <div className="flex justify-center my-1">
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-heading font-bold text-emerald-400">B</span>
            </div>
            <span className="text-xs font-body text-foreground truncate">
              {pointB ? `${pointB.name} (${pointB.lat.toFixed(2)}°, ${pointB.lng.toFixed(2)}°)` : '—'}
            </span>
          </div>

          {distance !== null && (
            <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 px-3 py-2.5 text-center">
              <p className="text-[10px] text-amber-400/70 font-body uppercase tracking-wide mb-0.5">Geodesic Distance</p>
              <p className="font-heading font-bold text-xl text-amber-400">{distance.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</p>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">along the lunar surface</p>
            </div>
          )}

          {(pointA || pointB) && (
            <button
              onClick={onClear}
              className="mt-3 w-full text-[11px] font-body text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear points
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}