import React, { useMemo } from 'react';

function getLunarPhase(date = new Date()) {
  // Known new moon: Jan 6, 2000 at 18:14 UTC
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const LUNAR_CYCLE = 29.530588853; // days

  const diffMs = date - knownNewMoon;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const cycleDays = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const phase = cycleDays / LUNAR_CYCLE; // 0–1

  let name, emoji, illumination, description;
  const illum = Math.round(Math.abs(Math.cos(phase * 2 * Math.PI)) * 50 + 50);

  if (phase < 0.025 || phase > 0.975) {
    name = 'New Moon'; emoji = '🌑';
    illumination = '0–2%';
    description = 'The Moon is between Earth and Sun. The lunar surface facing Earth is in shadow.';
  } else if (phase < 0.25) {
    name = 'Waxing Crescent'; emoji = '🌒';
    illumination = `${Math.round(phase / 0.25 * 49) + 1}%`;
    description = 'A sliver of the Moon is lit, growing larger each night as the Moon moves eastward.';
  } else if (phase < 0.275) {
    name = 'First Quarter'; emoji = '🌓';
    illumination = '50%';
    description = 'Half the Moon is lit. The Moon is 90° from the Sun in Earth\'s sky.';
  } else if (phase < 0.475) {
    name = 'Waxing Gibbous'; emoji = '🌔';
    illumination = `${Math.round((phase - 0.25) / 0.25 * 49) + 51}%`;
    description = 'More than half the Moon is illuminated. The lit area continues to grow.';
  } else if (phase < 0.525) {
    name = 'Full Moon'; emoji = '🌕';
    illumination = '100%';
    description = 'The Moon is opposite the Sun. The entire near side is fully illuminated.';
  } else if (phase < 0.725) {
    name = 'Waning Gibbous'; emoji = '🌖';
    illumination = `${Math.round((0.75 - phase) / 0.25 * 49) + 51}%`;
    description = 'The illuminated portion decreases each night after the full moon.';
  } else if (phase < 0.775) {
    name = 'Last Quarter'; emoji = '🌗';
    illumination = '50%';
    description = 'The opposite half from the First Quarter is lit. Rising around midnight.';
  } else {
    name = 'Waning Crescent'; emoji = '🌘';
    illumination = `${Math.round((1 - phase) / 0.225 * 49) + 1}%`;
    description = 'A shrinking crescent visible before sunrise, heading toward new moon.';
  }

  // Days until next full moon / next new moon
  const daysInCycle = cycleDays;
  const daysToFull = daysInCycle < 14.765 ? 14.765 - daysInCycle : LUNAR_CYCLE - daysInCycle + 14.765;
  const daysToNew = daysInCycle > 0.5 ? LUNAR_CYCLE - daysInCycle : -daysInCycle;

  return {
    name, emoji, phase, cycleDays: Math.round(cycleDays * 10) / 10,
    illumination: typeof illumination === 'string' ? illumination : `${illum}%`,
    description,
    daysToFull: Math.round(daysToFull * 10) / 10,
    daysToNew: Math.round(Math.abs(daysToNew) * 10) / 10,
    ageInDays: Math.round(cycleDays * 10) / 10,
    nextFullMoon: new Date(date.getTime() + daysToFull * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    nextNewMoon: new Date(date.getTime() + Math.abs(daysToNew) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

// SVG Moon phase visual
function MoonVisual({ phase }) {
  // phase: 0–1
  // Draw illuminated half using SVG clip path
  const size = 80;
  const r = size / 2;
  const isWaxing = phase < 0.5;
  const phaseFrac = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2;
  // x control for bezier (limb)
  const limbX = isWaxing
    ? r - phaseFrac * size  // waxing: shadow shrinks from left
    : -r + phaseFrac * size; // waning: shadow grows from right

  const pathD = isWaxing
    ? `M ${r} 0 A ${r} ${r} 0 0 1 ${r} ${size} A ${Math.abs(limbX)} ${r} 0 0 ${phaseFrac < 0.5 ? 1 : 0} ${r} 0`
    : `M ${r} 0 A ${r} ${r} 0 0 0 ${r} ${size} A ${Math.abs(limbX)} ${r} 0 0 ${phaseFrac < 0.5 ? 0 : 1} ${r} 0`;

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Dark moon base */}
        <circle cx={r} cy={r} r={r - 1} fill="#1a1a2e" stroke="#334" strokeWidth="1" />
        {/* Illuminated part */}
        <clipPath id="moonClip">
          <circle cx={r} cy={r} r={r - 1} />
        </clipPath>
        <path d={pathD} fill="#d4c9a8" opacity="0.92" clipPath="url(#moonClip)" />
        {/* Surface texture lines */}
        <circle cx={r} cy={r} r={r - 1} fill="none" stroke="#ffffff08" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

export default function MoonPhase() {
  const phaseData = useMemo(() => getLunarPhase(new Date()), []);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-4 space-y-4">
      {/* Phase visual + name */}
      <div className="flex items-center gap-4">
        <MoonVisual phase={phaseData.phase} />
        <div>
          <p className="text-[10px] text-muted-foreground font-body uppercase tracking-widest mb-0.5">Current Phase</p>
          <p className="font-heading font-bold text-base text-foreground">{phaseData.emoji} {phaseData.name}</p>
          <p className="text-xs text-muted-foreground font-body">{today}</p>
        </div>
      </div>

      {/* Phase progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-body mb-1">
          <span>New Moon</span>
          <span>Day {phaseData.ageInDays} / 29.5</span>
          <span>New Moon</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-slate-400 to-yellow-200"
            style={{ width: `${phaseData.phase * 100}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Illumination', value: phaseData.illumination },
          { label: 'Cycle Day', value: `${phaseData.ageInDays}d` },
          { label: 'Next Full', value: phaseData.nextFullMoon },
          { label: 'Next New', value: phaseData.nextNewMoon },
        ].map(({ label, value }) => (
          <div key={label} className="bg-secondary/60 rounded-xl p-2.5">
            <p className="text-[9px] text-muted-foreground font-body uppercase tracking-wider">{label}</p>
            <p className="text-sm font-heading font-semibold text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground font-body leading-relaxed border-t border-border pt-3">
        {phaseData.description}
      </p>

      {/* Scientific note */}
      <div className="text-[10px] text-muted-foreground/60 font-body">
        Lunar cycle: 29.53 days · Based on synodic period calculation
      </div>
    </div>
  );
}