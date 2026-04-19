import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, AlertTriangle, Info, Calendar, Moon, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LunarEventAlert() {
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAlert();
    const interval = setInterval(fetchAlert, 3600000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlert = async () => {
    try {
      const res = await base44.functions.invoke('lunarEventAlerts', { action: 'getAlert' });
      setAlert(res.data);
      setDismissed(false);
    } catch (err) {
      console.error('Failed to fetch lunar alert:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !alert || dismissed) return null;

  const levelConfig = {
    critical: {
      icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
      bg: 'bg-red-950/80 border-red-500/40',
      titleColor: 'text-red-400',
      dot: 'bg-red-400',
    },
    important: {
      icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
      bg: 'bg-amber-950/80 border-amber-500/40',
      titleColor: 'text-amber-400',
      dot: 'bg-amber-400',
    },
    info: {
      icon: <Info className="w-4 h-4 text-blue-400" />,
      bg: 'bg-blue-950/80 border-blue-500/40',
      titleColor: 'text-blue-400',
      dot: 'bg-blue-400',
    },
  };

  const cfg = levelConfig[alert.alertLevel] || levelConfig.info;

  return (
    <div className="fixed bottom-14 right-4 z-[800] w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`rounded-2xl border ${cfg.bg} shadow-2xl backdrop-blur-xl overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 mt-0.5 relative">
              {cfg.icon}
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-heading font-bold ${cfg.titleColor} leading-snug`}>
                {alert.title}
              </p>
              <p className="text-xs text-foreground/60 font-body mt-0.5 leading-relaxed">
                {alert.message}
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 pb-4 space-y-2 border-t border-white/10 pt-3"
              >
                {alert.currentPhase && (
                  <div className="flex items-center gap-2 text-xs text-foreground/60 font-body">
                    <Moon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span><strong className="text-foreground/80">Phase:</strong> {alert.currentPhase.phaseName} — {alert.currentPhase.illuminationPercent}% lit</span>
                  </div>
                )}
                {alert.nextEvent && (
                  <div className="flex items-center gap-2 text-xs text-foreground/60 font-body">
                    <Calendar className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span><strong className="text-foreground/80">Next {alert.nextEvent.type}:</strong> {alert.nextEvent.dateFormatted} · {alert.nextEvent.timeFormatted}</span>
                  </div>
                )}
                {alert.actionItems?.length > 0 && (
                  <div className="text-xs text-foreground/60 font-body pt-1">
                    <p className="font-medium text-foreground/70 mb-1">💡 Tips:</p>
                    <ul className="space-y-0.5 ml-3 list-disc">
                      {alert.actionItems.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full px-4 py-2 text-xs text-foreground/40 font-body hover:text-foreground/60 transition-colors border-t border-white/5 text-center"
          >
            {expanded ? 'Hide details ↑' : 'Show details ↓'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}