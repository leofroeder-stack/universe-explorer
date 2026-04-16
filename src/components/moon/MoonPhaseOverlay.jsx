import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getLunarPhase(date = new Date()) {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const LUNAR_CYCLE = 29.530588853;
  const diffDays = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const cycleDays = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const phase = cycleDays / LUNAR_CYCLE;

  let name, emoji, illumination;
  if (phase < 0.025 || phase > 0.975) { name = 'New Moon'; emoji = '🌑'; illumination = '~0%'; }
  else if (phase < 0.25) { name = 'Waxing Crescent'; emoji = '🌒'; illumination = `${Math.round(phase / 0.25 * 49) + 1}%`; }
  else if (phase < 0.275) { name = 'First Quarter'; emoji = '🌓'; illumination = '50%'; }
  else if (phase < 0.475) { name = 'Waxing Gibbous'; emoji = '🌔'; illumination = `${Math.round((phase - 0.25) / 0.25 * 49) + 51}%`; }
  else if (phase < 0.525) { name = 'Full Moon'; emoji = '🌕'; illumination = '100%'; }
  else if (phase < 0.725) { name = 'Waning Gibbous'; emoji = '🌖'; illumination = `${Math.round((0.75 - phase) / 0.25 * 49) + 51}%`; }
  else if (phase < 0.775) { name = 'Last Quarter'; emoji = '🌗'; illumination = '50%'; }
  else { name = 'Waning Crescent'; emoji = '🌘'; illumination = `${Math.round((1 - phase) / 0.225 * 49) + 1}%`; }

  const daysToFull = cycleDays < 14.765 ? 14.765 - cycleDays : LUNAR_CYCLE - cycleDays + 14.765;
  const daysToNew = cycleDays > 0.5 ? LUNAR_CYCLE - cycleDays : cycleDays;

  return {
    name, emoji, phase, illumination,
    ageInDays: Math.round(cycleDays * 10) / 10,
    nextFullMoon: new Date(date.getTime() + daysToFull * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    nextNewMoon: new Date(date.getTime() + Math.abs(daysToNew) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    daysToFull: Math.round(daysToFull * 10) / 10,
  };
}

function MoonSVG({ phase, size = 56 }) {
  const r = size / 2;
  const isWaxing = phase < 0.5;
  const phaseFrac = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
  const limbX = isWaxing ? r - phaseFrac * size : -r + phaseFrac * size;
  const pathD = isWaxing
    ? `M ${r} 0 A ${r} ${r} 0 0 1 ${r} ${size} A ${Math.abs(limbX)} ${r} 0 0 ${phaseFrac < 0.5 ? 1 : 0} ${r} 0`
    : `M ${r} 0 A ${r} ${r} 0 0 0 ${r} ${size} A ${Math.abs(limbX)} ${r} 0 0 ${phaseFrac < 0.5 ? 0 : 1} ${r} 0`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 1} fill="#1a1a2e" stroke="#334" strokeWidth="1" />
      <clipPath id="mpo-clip">
        <circle cx={r} cy={r} r={r - 1} />
      </clipPath>
      <path d={pathD} fill="#d4c9a8" opacity="0.92" clipPath="url(#mpo-clip)" />
    </svg>
  );
}

export default function MoonPhaseOverlay() {
  const [open, setOpen] = useState(false);
  const phaseData = useMemo(() => getLunarPhase(new Date()), []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Current Moon Phase"
        className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg text-lg leading-none"
      >
        {phaseData.emoji}
      </button>

      {/* Phase popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="phase-popup"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-14 top-0 w-64 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-[500] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
              <span className="text-[10px] font-body uppercase tracking-widest text-muted-foreground">Live Moon Phase</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Visual + name */}
              <div className="flex items-center gap-4">
                <MoonSVG phase={phaseData.phase} size={56} />
                <div>
                  <p className="font-heading font-bold text-base text-foreground leading-tight">{phaseData.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{phaseData.illumination} illuminated</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-body mb-1">
                  <span>🌑 New</span>
                  <span>Day {phaseData.ageInDays} / 29.5</span>
                  <span>🌕 Full</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-slate-400 to-yellow-200"
                    style={{ width: `${phaseData.phase * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Next Full Moon', value: phaseData.nextFullMoon },
                  { label: 'Days to Full', value: `${phaseData.daysToFull}d` },
                  { label: 'Next New Moon', value: phaseData.nextNewMoon },
                  { label: 'Cycle Day', value: `${phaseData.ageInDays} / 29.5` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary/60 rounded-xl p-2">
                    <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">{label}</p>
                    <p className="text-xs font-heading font-semibold text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}