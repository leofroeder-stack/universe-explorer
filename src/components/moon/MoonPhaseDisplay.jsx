import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function getCurrentLunarPhase() {
  const REFERENCE_NEW_MOON = new Date('2000-01-06T18:14:00Z');
  const LUNAR_CYCLE_DAYS = 29.53058867;
  const now = new Date();
  const daysSinceEpoch = (now - REFERENCE_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = daysSinceEpoch % LUNAR_CYCLE_DAYS;
  const illumination = (1 - Math.cos((2 * Math.PI * phase) / LUNAR_CYCLE_DAYS)) / 2;

  let phaseName = '';
  if (phase < 1.84) phaseName = 'New Moon';
  else if (phase < 7.38) phaseName = 'Waxing Crescent';
  else if (phase < 9.23) phaseName = 'First Quarter';
  else if (phase < 14.77) phaseName = 'Waxing Gibbous';
  else if (phase < 16.61) phaseName = 'Full Moon';
  else if (phase < 22.15) phaseName = 'Waning Gibbous';
  else if (phase < 23.99) phaseName = 'Last Quarter';
  else phaseName = 'Waning Crescent';

  return {
    phaseName,
    illuminationPercent: Math.round(illumination * 100),
    cycleDay: phase.toFixed(1),
    illumination,
  };
}

function MoonPhaseCanvas({ illumination, size = 56 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2, cy = size / 2, r = size / 2 - 2;

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    const shadeX = cx + (illumination * 2 - 1) * r;
    const gradient = ctx.createLinearGradient(shadeX - r, cy, shadeX + r, cy);
    gradient.addColorStop(0, 'rgba(15,15,25,1)');
    gradient.addColorStop(illumination, 'rgba(220,195,150,0.95)');
    gradient.addColorStop(1, 'rgba(220,195,150,0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    ctx.strokeStyle = 'rgba(210,180,140,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [illumination, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

function getPhaseEmoji(name) {
  switch (name) {
    case 'New Moon': return '🌑';
    case 'Waxing Crescent': return '🌒';
    case 'First Quarter': return '🌓';
    case 'Waxing Gibbous': return '🌔';
    case 'Full Moon': return '🌕';
    case 'Waning Gibbous': return '🌖';
    case 'Last Quarter': return '🌗';
    case 'Waning Crescent': return '🌘';
    default: return '🌙';
  }
}

export default function MoonPhaseDisplay() {
  const [phaseData, setPhaseData] = useState(getCurrentLunarPhase());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPhaseData(getCurrentLunarPhase()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Collapsed icon button */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg text-lg"
        title="Moon Phase"
      >
        {getPhaseEmoji(phaseData.phaseName)}
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-[590]" onClick={() => setExpanded(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.85, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute left-12 top-0 z-[600] w-44 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-4 flex flex-col items-center gap-3"
            >
              <p className="text-xs font-heading font-semibold text-foreground text-center leading-tight">
                {phaseData.phaseName}
              </p>

              <MoonPhaseCanvas illumination={phaseData.illumination} size={72} />

              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground font-body">
                  <span>Illumination</span>
                  <span className="text-foreground font-medium">{phaseData.illuminationPercent}%</span>
                </div>
                <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-300/80"
                    style={{ width: `${phaseData.illuminationPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-body pt-0.5">
                  <span>Cycle day</span>
                  <span className="text-foreground font-medium">{phaseData.cycleDay} / 29.5</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}