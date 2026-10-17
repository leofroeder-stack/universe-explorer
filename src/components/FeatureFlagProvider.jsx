import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const FeatureFlagContext = createContext({});

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const allFlags = await base44.entities.FeatureFlag.list();
        const flagMap = {};
        allFlags.forEach(flag => {
          flagMap[flag.key] = flag.enabled;
        });
        setFlags(flagMap);
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
    let unsubscribe;
    try {
      unsubscribe = base44.entities.FeatureFlag.subscribe(() => {
        loadFlags();
      });
    } catch {}

    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  const isEnabled = (featureKey) => flags[featureKey] === true;

  return (
    <FeatureFlagContext.Provider value={{ flags, loading, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag must be used within FeatureFlagProvider');
  }
  return context;
}