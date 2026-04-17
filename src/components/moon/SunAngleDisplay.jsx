import React, { useEffect, useState } from 'react';
import { Sun } from 'lucide-react';

// Computes the sun's ecliptic position from the current date/time
// Returns {azimuth, elevation, x, y, z} — a unit vector pointing toward the Sun
function computeSunDirection() {
  const now = new Date();
  const jd = now / 86400000 + 2440587.5; // Julian Day
  const n = jd - 2451545.0; // days since J2000

  // Mean longitude & anomaly (degrees)
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180);
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180);
  const epsilon = 23.439 * (Math.PI / 180); // obliquity

  // Ecliptic → equatorial
  const sx = Math.cos(lambda);
  const sy = Math.cos(epsilon) * Math.sin(lambda);
  const sz = Math.sin(epsilon) * Math.sin(lambda);

  // Sun elevation above ecliptic plane (approx degrees for display)
  const elev = Math.asin(sz) * (180 / Math.PI);
  const az = Math.atan2(sy, sx) * (180 / Math.PI);

  return { x: sx, y: sz, z: sy, azimuth: az, elevation: elev };
}

export default function SunAngleDisplay({ sunLightRef }) {
  const [sunInfo, setSunInfo] = useState(() => computeSunDirection());

  useEffect(() => {
    const update = () => {
      const dir = computeSunDirection();
      setSunInfo(dir);
      // Push live position to Three.js directional light
      if (sunLightRef?.current) {
        sunLightRef.current.position.set(dir.x * 10, dir.y * 10, dir.z * 10);
      }
    };
    update();
    const id = setInterval(update, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, [sunLightRef]);

  const elevLabel = sunInfo.elevation >= 0 ? `+${sunInfo.elevation.toFixed(1)}°` : `${sunInfo.elevation.toFixed(1)}°`;
  const azLabel = `${((sunInfo.azimuth + 360) % 360).toFixed(1)}°`;

  return (
    <div className="absolute bottom-20 right-20 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-xl border border-border shadow-lg">
      <Sun className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] text-muted-foreground font-body uppercase tracking-wide">Sun Angle</span>
        <span className="text-[11px] text-foreground font-body font-medium">
          Az {azLabel} · El {elevLabel}
        </span>
      </div>
    </div>
  );
}