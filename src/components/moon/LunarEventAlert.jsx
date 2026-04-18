import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, AlertTriangle, Info, Calendar, Moon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LunarEventAlert() {
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchAlert();
    const interval = setInterval(fetchAlert, 3600000); // refresh every hour
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

  const getIcon = () => {
    switch (alert.alertLevel) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'important':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (alert.alertLevel) {
      case 'critical':
        return 'bg-red-600/10 border-red-600/30';
      case 'important':
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-blue-600/10 border-blue-600/30';
    }
  };

  const getTitleColor = () => {
    switch (alert.alertLevel) {
      case 'critical':
        return 'text-red-500';
      case 'important':
        return 'text-amber-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
        className={`rounded-xl border ${getBgColor()} p-4 shadow-lg backdrop-blur-sm`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-left w-full hover:opacity-80 transition-opacity"
              >
                <h3 className={`text-sm font-heading font-bold ${getTitleColor()} leading-snug`}>
                  {alert.title}
                </h3>
                <p className="text-xs text-foreground/70 font-body mt-1">
                  {alert.message}
                </p>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-2 pt-3 border-t border-white/10"
                  >
                    {/* Current phase */}
                    {alert.currentPhase && (
                      <div className="text-xs text-foreground/60 font-body space-y-1">
                        <div className="flex items-center gap-2">
                          <Moon className="w-3.5 h-3.5 text-accent" />
                          <span>
                            <strong>Current:</strong> {alert.currentPhase.phaseName} ({alert.currentPhase.illuminationPercent}% illuminated)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Next event */}
                    {alert.nextEvent && (
                      <div className="text-xs text-foreground/60 font-body space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>
                            <strong>Next {alert.nextEvent.type}:</strong> {alert.nextEvent.dateFormatted} at {alert.nextEvent.timeFormatted}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action items */}
                    {alert.actionItems && alert.actionItems.length > 0 && (
                      <div className="text-xs text-foreground/60 font-body pt-2">
                        <p className="font-medium text-foreground/70 mb-1">💡 Tips:</p>
                        <ul className="space-y-1 ml-4 list-disc">
                          {alert.actionItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Expand indicator */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-foreground/50 font-body mt-2 hover:text-foreground/70 transition-colors"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}