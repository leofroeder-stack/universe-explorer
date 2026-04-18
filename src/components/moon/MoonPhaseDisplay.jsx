import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Calculate current lunar phase data
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
    cycleDay: Math.round(phase),
    illumination,
  };
}

// Render moon phase circle (2D visualization)
function MoonPhaseCanvas({ illumination }) {
  const canvasRef = useRef(null);
  
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const size = 60;
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    // Black background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);
    
    // Draw moon circle outline
    ctx.strokeStyle = 'rgba(210, 180, 140, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw illuminated portion
    ctx.fillStyle = 'rgba(210, 180, 140, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    
    // Light comes from the right; shift illumination based on phase
    const shadeX = centerX + (illumination * 2 - 1) * radius;
    const gradient = ctx.createLinearGradient(shadeX - radius, centerY, shadeX + radius, centerY);
    gradient.addColorStop(0, 'rgba(20, 20, 20, 1)');
    gradient.addColorStop(illumination, 'rgba(210, 180, 140, 0.9)');
    gradient.addColorStop(1, 'rgba(210, 180, 140, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }, [illumination]);
  
  return <canvas ref={canvasRef} className="w-12 h-12" />;
}

function MoonPhaseDisplay() {
  const [phaseData, setPhaseData] = useState(getCurrentLunarPhase());

  useEffect(() => {
    setPhaseData(getCurrentLunarPhase());
    const interval = setInterval(() => {
      setPhaseData(getCurrentLunarPhase());
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const getPhaseEmoji = (name) => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-2 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg"
    >
      <div className="text-2xl">
        {getPhaseEmoji(phaseData.phaseName)}
      </div>
      
      <div className="text-[10px] text-muted-foreground font-body text-center whitespace-nowrap">
        <div className="font-semibold text-foreground">{phaseData.phaseName}</div>
        <div>{phaseData.illuminationPercent}% lit</div>
        <div className="text-[9px] opacity-60">Day {phaseData.cycleDay}/29.5</div>
      </div>

      {/* Mini moon phase visualization */}
      <div className="flex justify-center mt-1">
        <MoonPhaseCanvas illumination={phaseData.illumination} />
      </div>
    </motion.div>
  );
}

export default MoonPhaseDisplay;