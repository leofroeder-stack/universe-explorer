import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown, Clock } from 'lucide-react';

// Only markers with parseable dates (missions + events with real years)
const MIN_YEAR = 1959;
const MAX_YEAR = 2024;

function parseYear(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}

export default function TimeSlider({ allMarkers, onFilteredMarkersChange, minimized: minimizedProp, onMinimizeChange }) {
  const [year, setYear] = useState(MAX_YEAR);
  const [playing, setPlaying] = useState(false);
  const [minimizedInternal, setMinimizedInternal] = useState(false);
  const intervalRef = React.useRef(null);

  // Support both controlled (minimizedProp) and uncontrolled modes
  const minimized = minimizedProp !== undefined ? minimizedProp : minimizedInternal;
  const setMinimized = (val) => {
    setMinimizedInternal(val);
    if (onMinimizeChange) onMinimizeChange(val);
  };

  const filterByYear = useCallback((y) => {
    const filtered = allMarkers.filter(m => {
      const my = parseYear(m.date);
      if (my === null) return true; // no date = always show (ancient events, objects)
      return my <= y;
    });
    onFilteredMarkersChange(filtered, y);
  }, [allMarkers, onFilteredMarkersChange]);

  const handleChange = (e) => {
    const y = parseInt(e.target.value);
    setYear(y);
    filterByYear(y);
  };

  const startPlay = () => {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    let cur = year >= MAX_YEAR ? MIN_YEAR : year;
    setYear(cur);
    filterByYear(cur);
    intervalRef.current = setInterval(() => {
      cur += 1;
      if (cur > MAX_YEAR) {
        clearInterval(intervalRef.current);
        setPlaying(false);
        return;
      }
      setYear(cur);
      filterByYear(cur);
    }, 180);
  };

  React.useEffect(() => () => clearInterval(intervalRef.current), []);

  const reset = () => {
    clearInterval(intervalRef.current);
    setPlaying(false);
    setYear(MIN_YEAR);
    filterByYear(MIN_YEAR);
  };

  const skip = (dir) => {
    const y = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year + dir * 5));
    setYear(y);
    filterByYear(y);
  };

  // Milestones for tick marks
  const milestones = [
    { year: 1959, label: '\'59' },
    { year: 1966, label: '\'66' },
    { year: 1969, label: 'Apollo 11' },
    { year: 1972, label: '\'72' },
    { year: 1990, label: '\'90' },
    { year: 2000, label: '2000' },
    { year: 2010, label: '\'10' },
    { year: 2019, label: 'Chang\'e' },
    { year: 2023, label: 'India' },
  ];

  const pct = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  if (minimized) {
    return (
      <div className="absolute bottom-16 left-4 z-[500]">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl hover:bg-secondary transition-colors"
          title="Expand Historical Timeline"
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-body font-medium text-foreground">{year}</span>
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-16 left-4 w-[calc(100%-2rem)] max-w-2xl z-[500]">
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl px-5 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-body text-muted-foreground">Historical Timeline</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-heading font-bold text-foreground">{year}</span>
              <span className="text-xs text-muted-foreground font-body">
                {allMarkers.filter(m => {
                  const y = parseYear(m.date);
                  return y !== null && y === year;
                }).length} events this year
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Reset">
              <SkipBack className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => skip(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="-5 years">
              <span className="text-[10px] font-bold text-muted-foreground">−5yr</span>
            </button>
            <button
              onClick={startPlay}
              className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors flex items-center gap-1.5"
            >
              {playing
                ? <Pause className="w-3.5 h-3.5 text-primary" />
                : <Play className="w-3.5 h-3.5 text-primary" />}
              <span className="text-xs font-body font-medium text-primary">
                {playing ? 'Pause' : 'Play'}
              </span>
            </button>
            <button onClick={() => skip(1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="+5 years">
              <span className="text-[10px] font-bold text-muted-foreground">+5yr</span>
            </button>
            <button onClick={() => { setYear(MAX_YEAR); filterByYear(MAX_YEAR); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <SkipForward className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {/* Minimize button */}
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors ml-1"
              title="Minimize timeline"
            >
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <div className="relative h-1.5 bg-secondary rounded-full mb-1">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <input
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={year}
            onChange={handleChange}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
            style={{ height: '6px' }}
          />
        </div>

        {/* Milestone labels */}
        <div className="relative h-5 mt-1">
          {milestones.map(m => {
            const p = ((m.year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
            const isActive = year >= m.year;
            return (
              <button
                key={m.year}
                onClick={() => { setYear(m.year); filterByYear(m.year); }}
                className="absolute transform -translate-x-1/2 text-[9px] font-body transition-colors whitespace-nowrap"
                style={{
                  left: `${p}%`,
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  fontWeight: m.label.length > 4 ? 600 : 400,
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}