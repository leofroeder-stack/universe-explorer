import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Settings, ArrowLeft, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [newFeatureName, setNewFeatureName] = useState('');

  useEffect(() => {
    const checkAdminAndLoadFlags = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          navigate('/');
          return;
        }
        setUser(currentUser);
        const allFlags = await base44.entities.FeatureFlag.list();
        setFlags(allFlags);
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadFlags();
  }, [navigate]);

  const toggleFlag = async (flagId, currentEnabled) => {
    try {
      await base44.entities.FeatureFlag.update(flagId, { enabled: !currentEnabled });
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, enabled: !currentEnabled } : f));
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const createNewFlag = async () => {
    if (!newFeatureKey.trim() || !newFeatureName.trim()) return;
    try {
      const newFlag = await base44.entities.FeatureFlag.create({
        key: newFeatureKey.toLowerCase().replace(/\s+/g, '_'),
        name: newFeatureName,
        enabled: false
      });
      setFlags(prev => [...prev, newFlag]);
      setNewFeatureKey('');
      setNewFeatureName('');
    } catch (error) {
      console.error('Failed to create flag:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.role === 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-heading font-bold">Feature Flags</h1>
          </div>
          <p className="text-muted-foreground font-body mb-6">Control which features are visible to users. Perfect for beta testing.</p>
        </motion.div>

        {/* Create new flag */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add New Feature Flag
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Feature key (e.g., measurements_tool)"
                value={newFeatureKey}
                onChange={(e) => setNewFeatureKey(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Display name (e.g., Measurement Tool)"
                value={newFeatureName}
                onChange={(e) => setNewFeatureName(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button onClick={createNewFlag} className="w-full">
                Create Flag
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature flags list */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="space-y-3">
            {flags.length === 0 ? (
              <Card className="border-border">
                <CardContent className="pt-6 text-center text-muted-foreground font-body">
                  No feature flags yet. Create one to get started.
                </CardContent>
              </Card>
            ) : (
              flags.map((flag) => (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-foreground">{flag.name}</h3>
                    <p className="text-xs text-muted-foreground font-body">{flag.key}</p>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground font-body mt-1">{flag.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-body font-medium px-2 py-1 rounded ${
                      flag.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                      className="cursor-pointer"
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}