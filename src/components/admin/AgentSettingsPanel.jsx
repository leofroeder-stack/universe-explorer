import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Settings, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AgentSettingsPanel() {
  const [config, setConfig] = useState({
    enabled: true,
    checkDataQuality: true,
    detectBugs: true,
    suggestFeatures: true,
    suggestImprovements: true,
    reportFrequency: 'weekly', // weekly, daily, monthly
    minSeverity: 'medium', // all, medium, critical
  });
  const [saving, setSaving] = useState(false);
  const [lastReport, setLastReport] = useState(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.AppSettings.filter({
        category: 'agent_data_quality',
      });
      if (settings.length > 0) {
        const loaded = {};
        settings.forEach(s => {
          loaded[s.key] = s.value === 'true' ? true : s.value === 'false' ? false : s.value;
        });
        setConfig(prev => ({ ...prev, ...loaded }));
      }
      // Try to load last report timestamp
      const reports = await base44.entities.AppSettings.filter({
        key: 'agent_last_report',
      });
      if (reports.length > 0) {
        setLastReport(reports[0].value);
      }
    } catch (err) {
      console.error('Failed to load agent settings:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(config)) {
        const existing = await base44.entities.AppSettings.filter({
          key: `agent_${key}`,
          category: 'agent_data_quality',
        });
        const stringValue = typeof value === 'boolean' ? String(value) : value;
        if (existing.length > 0) {
          await base44.entities.AppSettings.update(existing[0].id, { value: stringValue });
        } else {
          await base44.entities.AppSettings.create({
            key: `agent_${key}`,
            value: stringValue,
            category: 'agent_data_quality',
            label: key.replace(/([A-Z])/g, ' $1').trim(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to save agent settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRunReport = async () => {
    setSaving(true);
    try {
      // Invoke the agent to run an immediate report
      await base44.functions.invoke('dataQualityReport', { immediate: true });
      setLastReport(new Date().toISOString());
    } catch (err) {
      console.error('Failed to run report:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Data Quality Agent</h2>
        <p className="text-sm text-muted-foreground font-body">
          Configure the AI agent that monitors data quality, detects bugs, and suggests improvements.
        </p>
      </div>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Agent Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border">
            <div>
              <p className="font-medium text-foreground">Agent Active</p>
              <p className="text-xs text-muted-foreground mt-1">Enable/disable all agent functionality</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>

          {lastReport && (
            <div className="p-3 rounded-lg bg-green-600/10 border border-green-600/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-600">Last Report</p>
                <p className="text-xs text-green-500/80">
                  {new Date(lastReport).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Capabilities</CardTitle>
          <CardDescription>Select which types of analysis the agent should perform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'checkDataQuality', label: 'Data Quality Checks', desc: 'Scan for missing or incomplete fields' },
            { key: 'detectBugs', label: 'Bug Detection', desc: 'Identify data inconsistencies and integrity issues' },
            { key: 'suggestFeatures', label: 'Feature Suggestions', desc: 'Recommend new features based on data patterns' },
            { key: 'suggestImprovements', label: 'Improvement Suggestions', desc: 'Suggest UI/UX and performance improvements' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between p-3 rounded-lg bg-card/50 border border-border hover:border-border/80 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
              <Switch
                checked={config[key]}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, [key]: checked }))}
                className="ml-4 flex-shrink-0"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Configuration</CardTitle>
          <CardDescription>Control how and when reports are generated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Report Frequency</label>
            <Select value={config.reportFrequency} onValueChange={(val) => setConfig(prev => ({ ...prev, reportFrequency: val }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Agent will analyze and report on this schedule</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Minimum Report Severity</label>
            <Select value={config.minSeverity} onValueChange={(val) => setConfig(prev => ({ ...prev, minSeverity: val }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="medium">Medium & Critical</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Filter which issues are reported based on severity</p>
          </div>
        </CardContent>
      </Card>

      {/* Agent Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            Agent Interaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 font-body">
            Chat directly with the agent or run an immediate analysis report.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(base44.agents.getWhatsAppConnectURL('dataQualityAgent'), '_blank')}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat via WhatsApp
            </Button>
            <Button
              onClick={handleRunReport}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Running...' : 'Run Report Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}