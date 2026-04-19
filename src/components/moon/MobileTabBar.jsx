import React from 'react';
import { Globe, Map, Layers, Moon, Ruler, Scan, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlag } from '@/components/FeatureFlagProvider';
import { useAppSettings } from '@/components/AppSettingsProvider';

export default function MobileTabBar({
  viewMode, onViewModeChange,
  planet, onPlanetChange,
  measureActive, onToggleMeasure,
  onOpenMoonCycle,
  onOpenAR,
  onOpenLayers,
}) {
  const navigate = useNavigate();
  const { isEnabled } = useFeatureFlag();
  const { isHidden } = useAppSettings();

  const tabs = [
    // View: 3D
    !isHidden('hide_view_toggle') && {
      id: '3d',
      icon: Globe,
      label: '3D',
      active: viewMode === '3d',
      onPress: () => onViewModeChange('3d'),
    },
    // View: 2D
    !isHidden('hide_view_toggle') && {
      id: '2d',
      icon: Map,
      label: '2D Map',
      active: viewMode === '2d',
      onPress: () => onViewModeChange('2d'),
    },
    // Layers
    !isHidden('hide_layer_controls') && {
      id: 'layers',
      icon: Layers,
      label: 'Layers',
      active: false,
      onPress: onOpenLayers,
    },
    // Moon Cycle
    planet === 'moon' && isEnabled('moon_cycle') && !isHidden('hide_moon_cycle_button') && {
      id: 'moon-cycle',
      icon: Moon,
      label: 'Cycle',
      active: false,
      onPress: onOpenMoonCycle,
    },
    // Measure
    isEnabled('measurements') && !isHidden('hide_measure_button') && {
      id: 'measure',
      icon: Ruler,
      label: 'Measure',
      active: measureActive,
      activeColor: 'text-amber-400',
      onPress: onToggleMeasure,
    },
    // AR
    planet === 'moon' && isEnabled('ar_view') && !isHidden('hide_ar_button') && {
      id: 'ar',
      icon: Scan,
      label: 'AR',
      active: false,
      activeColor: 'text-primary',
      onPress: onOpenAR,
    },
    // Solar System
    !isHidden('hide_solar_system_link') && {
      id: 'solar',
      icon: Sun,
      label: 'Solar',
      active: false,
      onPress: () => navigate('/solar-system'),
    },
  ].filter(Boolean);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[600] bg-card/95 backdrop-blur-xl border-t border-border flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ id, icon: Icon, label, active, activeColor, onPress }) => (
        <button
          key={id}
          onClick={onPress}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 min-h-[56px] transition-colors ${
            active
              ? (activeColor || 'text-primary')
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] font-body font-medium leading-none">{label}</span>
          {active && (
            <span className={`absolute bottom-0 w-8 h-0.5 rounded-full ${activeColor ? activeColor.replace('text-', 'bg-') : 'bg-primary'}`} />
          )}
        </button>
      ))}
    </nav>
  );
}