import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AppSettingsContext = createContext({ isHidden: () => false, getSetting: () => null });

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState([]);

  useEffect(() => {
    base44.entities.AppSettings.list().then(setSettings).catch(() => {});

    const unsub = base44.entities.AppSettings.subscribe((event) => {
      setSettings(prev => {
        if (event.type === 'create') return [...prev, event.data];
        if (event.type === 'update') return prev.map(s => s.id === event.id ? event.data : s);
        if (event.type === 'delete') return prev.filter(s => s.id !== event.id);
        return prev;
      });
    });
    return unsub;
  }, []);

  const isHidden = (key) => {
    const s = settings.find(s => s.key === key);
    return s?.value === 'true';
  };

  const getSetting = (key, defaultVal = null) => {
    const s = settings.find(s => s.key === key);
    return s ? s.value : defaultVal;
  };

  return (
    <AppSettingsContext.Provider value={{ isHidden, getSetting }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}