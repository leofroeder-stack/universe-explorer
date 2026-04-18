import React, { useEffect, useRef } from 'react';

// A small canvas-based compass that mirrors the globe's Y rotation
export default function GlobeCompass({ globeRotationRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 4;

    let animId;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      const rotY = globeRotationRef?.current ?? 0;
      // heading: as globe rotates right, compass needle points left (inverse)
      const heading = -rotY;

      ctx.clearRect(0, 0, size, size);

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Background
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10,14,30,0.75)';
      ctx.fill();

      // Cardinal tick marks
      const cardinals = [
        { label: 'N', angle: 0, color: '#f87171' },
        { label: 'E', angle: Math.PI / 2, color: 'rgba(255,255,255,0.6)' },
        { label: 'S', angle: Math.PI, color: 'rgba(255,255,255,0.6)' },
        { label: 'W', angle: -Math.PI / 2, color: 'rgba(255,255,255,0.6)' },
      ];

      cardinals.forEach(({ label, angle, color }) => {
        const a = angle + heading;
        const tx = cx + Math.sin(a) * (r - 10);
        const ty = cy - Math.cos(a) * (r - 10);
        ctx.font = `bold ${label === 'N' ? 9 : 7}px sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx, ty);
      });

      // Needle — North (red) tip
      const nAngle = heading;
      ctx.save();
      ctx.translate(cx, cy);

      // North red half
      ctx.beginPath();
      ctx.moveTo(Math.sin(nAngle) * (r - 18), -Math.cos(nAngle) * (r - 18));
      ctx.lineTo(Math.sin(nAngle + Math.PI / 2) * 3, -Math.cos(nAngle + Math.PI / 2) * 3);
      ctx.lineTo(Math.sin(nAngle - Math.PI / 2) * 3, -Math.cos(nAngle - Math.PI / 2) * 3);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // South white half
      const sAngle = nAngle + Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.sin(sAngle) * (r - 18), -Math.cos(sAngle) * (r - 18));
      ctx.lineTo(Math.sin(nAngle + Math.PI / 2) * 3, -Math.cos(nAngle + Math.PI / 2) * 3);
      ctx.lineTo(Math.sin(nAngle - Math.PI / 2) * 3, -Math.cos(nAngle - Math.PI / 2) * 3);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.restore();
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [globeRotationRef]);

  return (
    <div className="absolute top-4 right-4 z-30" title="Orientation compass">
      <canvas
        ref={canvasRef}
        width={72}
        height={72}
        className="rounded-full shadow-xl border border-white/10"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}