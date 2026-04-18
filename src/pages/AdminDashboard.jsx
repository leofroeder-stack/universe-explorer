import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import OverviewPanel from '@/components/admin/OverviewPanel';
import VisibilityPanel from '@/components/admin/VisibilityPanel';
import NavigationPanel from '@/components/admin/NavigationPanel';
import FlagsPanel from '@/components/admin/FlagsPanel';
import AppSettingsPanel from '@/components/admin/AppSettingsPanel';
import TexturesPanel from '@/components/admin/TexturesPanel';

export default function AdminDashboard() {
  const [section, setSection] = useState('overview');
  const [flags, setFlags] = useState([]);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.FeatureFlag.list(),
      base44.entities.AppSettings.list(),
    ]).then(([f, s]) => {
      setFlags(f);
      setSettings(s);
    }).finally(() => setLoading(false));
  }, []);

  // Toggle a visibility/navigation setting (stored as AppSettings)
  const handleToggleSetting = async (key, currentlyHidden, category, label) => {
    const newValue = currentlyHidden ? 'false' : 'true';
    const existing = settings.find(s => s.key === key);
    if (existing) {
      await base44.entities.AppSettings.update(existing.id, { value: newValue });
      setSettings(prev => prev.map(s => s.id === existing.id ? { ...s, value: newValue } : s));
    } else {
      const created = await base44.entities.AppSettings.create({ key, value: newValue, category, label });
      setSettings(prev => [...prev, created]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const renderPanel = () => {
    switch (section) {
      case 'overview':    return <OverviewPanel flags={flags} settings={settings} onNavigate={setSection} />;
      case 'visibility':  return <VisibilityPanel settings={settings} onToggle={handleToggleSetting} />;
      case 'navigation':  return <NavigationPanel settings={settings} onToggle={handleToggleSetting} />;
      case 'features':    return <FlagsPanel flags={flags} onFlagsChange={setFlags} />;
      case 'settings':    return <AppSettingsPanel settings={settings} onSettingsChange={setSettings} />;
      case 'textures':    return <TexturesPanel />;
      default:            return null;
    }
  };

  return (
    <AdminGuard>
      <div className="h-screen flex bg-background overflow-hidden">
        <AdminSidebar active={section} onChange={setSection} />
        <main className="flex-1 overflow-y-auto p-6 max-w-3xl">
          {renderPanel()}
        </main>
      </div>
    </AdminGuard>
  );
}