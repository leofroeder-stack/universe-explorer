import React, { useState, useMemo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, CalendarDays, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

function getMoonPhase(date) {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const synodicMonth = 29.53058867;
  const diffDays = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  return ((diffDays % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
}

function getIllumination(phase) {
  return Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100);
}

function getPhaseName(phase) {
  if (phase < 0.03 || phase >= 0.97) return 'New Moon';
  if (phase < 0.22) return 'Waxing Crescent';
  if (phase < 0.28) return 'First Quarter';
  if (phase < 0.47) return 'Waxing Gibbous';
  if (phase < 0.53) return 'Full Moon';
  if (phase < 0.72) return 'Waning Gibbous';
  if (phase < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}

function MoonIcon({ phase, size = 28 }) {
  const r = size / 2;
  const isWaxing = phase < 0.5;
  const isFull = phase >= 0.47 && phase < 0.53;
  const isNew = phase < 0.03 || phase >= 0.97;

  let rx;
  if (phase < 0.25) rx = r * (1 - phase * 4);
  else if (phase < 0.5) rx = r * ((phase - 0.25) * 4);
  else if (phase < 0.75) rx = r * (1 - (phase - 0.5) * 4);
  else rx = r * ((phase - 0.75) * 4);

  const clipId = `mc-${size}-${Math.round(phase * 100)}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={r} cy={r} r={r - 1} fill="#1e1e2e" stroke="#334155" strokeWidth="0.5" />
      {!isNew && isFull && <circle cx={r} cy={r} r={r - 1} fill="#e2c97e" opacity={0.9} />}
      {!isNew && !isFull && (
        <>
          <defs>
            <clipPath id={clipId}>
              {isWaxing
                ? <path d={`M ${r} 1 A ${r-1} ${r-1} 0 0 1 ${r} ${size-1} A ${rx} ${r-1} 0 0 0 ${r} 1 Z`} />
                : <path d={`M ${r} 1 A ${r-1} ${r-1} 0 0 0 ${r} ${size-1} A ${rx} ${r-1} 0 0 1 ${r} 1 Z`} />
              }
            </clipPath>
          </defs>
          <circle cx={r} cy={r} r={r - 1} fill="#e2c97e" opacity={0.9} clipPath={`url(#${clipId})`} />
        </>
      )}
    </svg>
  );
}

function nextFullMoon(from) {
  let d = new Date(from);
  for (let i = 0; i < 35; i++) {
    if (getMoonPhase(d) >= 0.47 && getMoonPhase(d) < 0.53) return d;
    d = new Date(d.getTime() + 86400000);
  }
  return null;
}

function getUpcomingFullMoons(count = 3) {
  const results = [];
  let cursor = new Date();
  for (let i = 0; i < count; i++) {
    const fm = nextFullMoon(cursor);
    if (fm) { results.push(fm); cursor = new Date(fm.getTime() + 86400000 * 20); }
  }
  return results;
}

export default function MoonCycleCalendar({ isOpen, onClose, onJumpToDate }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const upcomingFullMoons = useMemo(() => getUpcomingFullMoons(3), []);
  const todayPhase = getMoonPhase(new Date());

  const handleJump = useCallback(() => {
    if (selectedDay && onJumpToDate) { onJumpToDate(selectedDay); onClose(); }
  }, [selectedDay, onJumpToDate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[700]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-16 bottom-4 md:inset-auto md:right-4 md:top-16 md:w-[420px] md:max-h-[calc(100dvh-5rem)] z-[800] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-heading font-bold text-base">Moon Cycle</span>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
                <MoonIcon phase={todayPhase} size={52} />
                <div>
                  <p className="text-[10px] text-muted-foreground font-body uppercase tracking-wide">Today</p>
                  <p className="font-heading font-bold text-sm">{getPhaseName(todayPhase)}</p>
                  <p className="text-xs text-muted-foreground font-body">{getIllumination(todayPhase)}% illuminated</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setViewMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-heading font-semibold text-sm">{format(viewMonth, 'MMMM yyyy')}</span>
                <button onClick={() => setViewMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <span key={d} className="text-[10px] font-body text-muted-foreground/60 uppercase">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((day) => {
                  const phase = getMoonPhase(day);
                  const isCurrentMonth = isSameMonth(day, viewMonth);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isFullMoon = phase >= 0.47 && phase < 0.53;
                  const isNewMoon = phase < 0.03 || phase >= 0.97;
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`flex flex-col items-center py-1.5 rounded-lg transition-all ${!isCurrentMonth ? 'opacity-25' : ''} ${isSelected ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-secondary'} ${isToday && !isSelected ? 'ring-1 ring-primary/50' : ''}`}
                    >
                      <MoonIcon phase={phase} size={22} />
                      <span className={`text-[9px] font-body mt-0.5 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      {(isFullMoon || isNewMoon) && (
                        <span className={`text-[7px] leading-none ${isFullMoon ? 'text-amber-400' : 'text-slate-400'}`}>
                          {isFullMoon ? '●' : '○'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {selectedDay && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <MoonIcon phase={getMoonPhase(selectedDay)} size={40} />
                        <div>
                          <p className="font-heading font-semibold text-sm">{format(selectedDay, 'MMMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground font-body">{getPhaseName(getMoonPhase(selectedDay))}</p>
                          <p className="text-xs font-body" style={{ color: '#e2c97e' }}>{getIllumination(getMoonPhase(selectedDay))}% illuminated</p>
                        </div>
                      </div>
                      <button onClick={handleJump} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-body font-semibold hover:opacity-90 transition-opacity">
                        <Zap className="w-3.5 h-3.5" />
                        Jump timeline to this date
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wide mb-2">Upcoming Full Moons</p>
                <div className="space-y-2">
                  {upcomingFullMoons.map((fm, i) => (
                    <button key={i} onClick={() => { setViewMonth(fm); setSelectedDay(fm); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary transition-colors">
                      <MoonIcon phase={0.5} size={28} />
                      <div className="text-left">
                        <p className="text-xs font-body font-medium text-foreground">{format(fm, 'EEEE, MMMM d, yyyy')}</p>
                        <p className="text-[10px] text-amber-400 font-body">100% illuminated</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}