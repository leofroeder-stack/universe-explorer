import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * LunarFlash — simulates Transient Lunar Phenomena (TLPs)
 * Random bright flashes at scientifically documented locations on the Moon.
 * Works as a pure CSS/canvas overlay on top of either the 2D map or 3D globe.
 */

// Known TLP hotspot locations (lat, lng) — historically documented sites
const TLP_SITES = [
  { name: 'Aristarchus',    lat: 23.7,  lng: -47.4 },
  { name: 'Plato',          lat: 51.6,  lng: -9.4  },
  { name: 'Alphonsus',      lat: -13.4, lng: -2.8  },
  { name: 'Copernicus',     lat: 9.7,   lng: -20.1 },
  { name: 'Tycho',          lat: -43.3, lng: -11.2 },
  { name: 'Grimaldi',       lat: -5.5,  lng: -68.6 },
  { name: 'Gassendi',       lat: -17.6, lng: -39.9 },
  { name: 'Kepler',         lat: 8.1,   lng: -38.0 },
  { name: "Messier",        lat: -1.9,  lng: 47.6  },
  { name: 'Proclus',        lat: 16.1,  lng: 46.9  },
];

// Color palette for flashes — from white-hot to amber/teal
const FLASH_COLORS = [
  '#ffffff',
  '#ffe8a0',
  '#ffd060',
  '#a0e8ff',
  '#60d4ff',
  '#c8a0ff',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function LunarFlash({ enabled, mode = '2d', globeRotationRef, cameraZRef }) {
  const canvasRef = useRef(null);
  const flashesRef = useRef([]); // active flash objects
  const animIdRef = useRef(null);
  const lastFlashTimeRef = useRef(0);

  // Schedule next flash interval (5–18 seconds between flashes)
  const nextIntervalRef = useRef(randomBetween(5000, 18000));

  const spawnFlash = useCallback(() => {
    const site = TLP_SITES[Math.floor(Math.random() * TLP_SITES.length)];
    const color = FLASH_COLORS[Math.floor(Math.random() * FLASH_COLORS.length)];
    flashesRef.current.push({
      site,
      color,
      age: 0,
      duration: randomBetween(600, 1800), // ms
      maxRadius: randomBetween(6, 22),
      pulses: Math.random() > 0.5 ? 2 : 1,
    });
    nextIntervalRef.current = randomBetween(5000, 18000);
  }, []);

  useEffect(() => {
    if (!enabled) {
      flashesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const draw = (now) => {
      animIdRef.current = requestAnimationFrame(draw);
      const dt = now - lastTime;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Maybe spawn a new flash
      lastFlashTimeRef.current += dt;
      if (lastFlashTimeRef.current >= nextIntervalRef.current) {
        lastFlashTimeRef.current = 0;
        spawnFlash();
      }

      // Draw and age each flash
      flashesRef.current = flashesRef.current.filter(f => f.age < f.duration);
      flashesRef.current.forEach(f => {
        f.age += dt;
        const progress = f.age / f.duration; // 0→1

        // Compute screen position from lat/lng
        let screenX, screenY;
        if (mode === '2d') {
          // 2D map: equirectangular projection onto canvas
          const normLng = (f.site.lng + 180) / 360;
          const normLat = (90 - f.site.lat) / 180;
          screenX = normLng * canvas.width;
          screenY = normLat * canvas.height;
        } else {
          // 3D globe: project lat/lng accounting for current globe rotation
          const rotY = globeRotationRef?.current ?? 0;
          const latRad = (f.site.lat * Math.PI) / 180;
          const lngRad = ((-f.site.lng + 90) * Math.PI) / 180;
          const x3 = Math.cos(latRad) * Math.cos(lngRad);
          const y3 = Math.sin(latRad);
          const z3 = Math.cos(latRad) * Math.sin(lngRad);

          // Rotate point by globe Y rotation
          const cosR = Math.cos(-rotY);
          const sinR = Math.sin(-rotY);
          const rx = x3 * cosR - z3 * sinR;
          const rz = x3 * sinR + z3 * cosR;

          // Only draw if on front hemisphere
          if (rz < 0.05) return;

          // Simple perspective projection
          const cameraZ = cameraZRef?.current ?? 3.2;
          const fov = 45 * (Math.PI / 180);
          const scale = (canvas.height / 2) / Math.tan(fov / 2);
          const perspective = scale / (cameraZ - rz);
          screenX = canvas.width / 2  + rx * perspective;
          screenY = canvas.height / 2 - y3 * perspective;
        }

        // Pulse envelope: rise → hold → fall (with optional double-pulse)
        let intensity;
        if (f.pulses === 2 && progress > 0.5) {
          const p2 = (progress - 0.5) * 2;
          intensity = Math.sin(p2 * Math.PI);
        } else {
          intensity = Math.sin(progress * Math.PI);
        }
        intensity = Math.pow(intensity, 0.6); // shape

        const radius = f.maxRadius * (0.3 + 0.7 * intensity);
        const alpha  = intensity * 0.92;

        // Guard: skip if any value is non-finite or radius is zero
        if (!isFinite(screenX) || !isFinite(screenY) || !isFinite(radius) || radius <= 0) return;

        // Outer soft glow
        const grd = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius * 3.5);
        grd.addColorStop(0,   hexToRgba(f.color, alpha * 0.7));
        grd.addColorStop(0.4, hexToRgba(f.color, alpha * 0.3));
        grd.addColorStop(1,   hexToRgba(f.color, 0));
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Inner bright core
        const inner = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
        inner.addColorStop(0,   hexToRgba('#ffffff', alpha));
        inner.addColorStop(0.5, hexToRgba(f.color,  alpha * 0.9));
        inner.addColorStop(1,   hexToRgba(f.color,  0));
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = inner;
        ctx.fill();
      });
    };

    animIdRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', resize);
      flashesRef.current = [];
    };
  }, [enabled, mode, spawnFlash]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}