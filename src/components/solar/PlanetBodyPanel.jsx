import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BODY_COLORS } from './solarData';

export default function PlanetBodyPanel({ body, planet, onClose }) {
  if (!body) return null;

  const color = BODY_COLORS[body.type];

  return (
    <AnimatePresence>
      {body && (
        <motion.div
          key={body.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-4 right-4 w-80 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl z-[500] overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-border" style={{ background: `${color}10` }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }}
                />
                <div className="min-w-0">
                  <h2 className="font-heading font-bold text-base text-foreground truncate">{body.name}</h2>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize"
                    style={{ background: `${color}25`, color }}
                  >
                    {body.type} · {planet.name}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-foreground/80 font-body leading-relaxed">{body.description}</p>

            <div className="space-y-2">
              {body.date && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-muted-foreground font-body w-20 flex-shrink-0 pt-0.5">Date</span>
                  <span className="text-[11px] text-foreground font-body">{body.date}</span>
                </div>
              )}
              {body.diameter && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-muted-foreground font-body w-20 flex-shrink-0 pt-0.5">Size</span>
                  <span className="text-[11px] text-foreground font-body">{body.diameter}</span>
                </div>
              )}
              {body.country && body.country !== 'N/A' && (
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-muted-foreground font-body w-20 flex-shrink-0 pt-0.5">Discovery</span>
                  <span className="text-[11px] text-foreground font-body">{body.country}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-[11px] text-muted-foreground font-body w-20 flex-shrink-0 pt-0.5">Location</span>
                <span className="text-[11px] text-foreground font-body">
                  {body.lat.toFixed(1)}°, {body.lng.toFixed(1)}°
                </span>
              </div>
            </div>

            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(body.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-body transition-colors"
              style={{ color }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Learn more on Wikipedia
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}