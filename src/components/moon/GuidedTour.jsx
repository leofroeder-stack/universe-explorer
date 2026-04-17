import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, X, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LAYER_COLORS } from './moonData';

export default function GuidedTour({ markers, onFocusMarker, onClose, isActive }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const timerRef = useRef(null);
  const DWELL_MS = 6000; // time to read each card

  const tourMarkers = markers.slice(0, Math.min(markers.length, 12));
  const current = tourMarkers[step];

  const goToStep = useCallback((idx) => {
    setShowCard(false);
    const target = tourMarkers[idx];
    if (!target) return;
    onFocusMarker(target);
    // Show card after globe rotation settles
    setTimeout(() => setShowCard(true), 1400);
  }, [tourMarkers, onFocusMarker]);

  // Auto-advance
  useEffect(() => {
    if (!playing || !isActive) return;
    goToStep(step);
    timerRef.current = setTimeout(() => {
      const next = (step + 1) % tourMarkers.length;
      setStep(next);
    }, DWELL_MS + 1500);
    return () => clearTimeout(timerRef.current);
  }, [step, playing, isActive]);

  const handleNext = () => {
    clearTimeout(timerRef.current);
    setStep(s => (s + 1) % tourMarkers.length);
  };

  const handleTogglePlay = () => {
    setPlaying(p => !p);
    if (!playing) goToStep(step);
  };

  if (!isActive || !current) return null;

  const color = LAYER_COLORS[current.type] || '#60a5fa';
  const progress = ((step + 1) / tourMarkers.length) * 100;

  return (
    <>
      {/* Tour info card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[min(90vw,420px)] pointer-events-none"
          >
            <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-0.5 bg-secondary">
                <motion.div
                  className="h-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-heading font-bold text-sm text-foreground">{current.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ background: `${color}20`, color }}>
                        {current.type}
                      </span>
                    </div>
                    {current.date && <p className="text-[10px] text-muted-foreground mb-1.5">{current.date}</p>}
                    <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">{current.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
                  <span className="text-[10px] text-muted-foreground font-body">
                    Stop <span className="text-foreground font-semibold">{step + 1}</span> of {tourMarkers.length}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Map className="w-3 h-3" />
                    {current.lat?.toFixed(1)}°, {current.lng?.toFixed(1)}°
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tour controls bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-card/95 backdrop-blur-2xl border border-border shadow-xl">
        <button
          onClick={handleTogglePlay}
          className="w-8 h-8 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-colors"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleNext}
          className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        <div className="flex gap-1 mx-1">
          {tourMarkers.map((_, i) => (
            <button
              key={i}
              onClick={() => { clearTimeout(timerRef.current); setStep(i); }}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 16 : 6,
                height: 6,
                background: i === step ? color : 'hsl(var(--muted))',
              }}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-destructive/20 hover:bg-destructive/30 text-destructive flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}