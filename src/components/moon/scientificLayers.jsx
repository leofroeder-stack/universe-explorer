// Scientific overlay layer definitions for Moon Explorer
// Each layer has regions with lat/lng/radius and a color representing the measurement value

export const SCIENTIFIC_LAYER_TYPES = {
  TOPOGRAPHY: 'topography',
  GRAVITY: 'gravity',
  MINERALS: 'minerals',
  TEMPERATURE: 'temperature',
};

export const SCIENTIFIC_LAYER_META = {
  topography: {
    label: 'Topography',
    description: 'Elevation Map — color-coded altitude from craters to mountains',
    unit: 'km',
    gradient: ['#0a1628', '#1a3a6e', '#2e6b9e', '#4db3a2', '#7ed87c', '#d4c85a', '#e88c3c', '#c94a1e', '#8b2020'],
    gradientLabels: ['-8 km', '-4 km', '0 km', '+4 km', '+8 km'],
    color: '#4db3a2',
    regions: [
      // Deep basins (very low)
      { lat: -53, lng: -169, r: 22, value: 0.05, label: 'SPA Basin (−8 km)' },
      { lat: 32.8, lng: -15.6, r: 15, value: 0.2, label: 'Mare Imbrium (−3 km)' },
      { lat: 8.5, lng: 31.4, r: 12, value: 0.25, label: 'Mare Tranquillitatis (−3 km)' },
      { lat: 18.4, lng: -57.4, r: 18, value: 0.18, label: 'Oceanus Procellarum (−2 km)' },
      { lat: -20, lng: 60, r: 14, value: 0.22, label: 'Mare Fecunditatis (−2 km)' },
      // Mid elevation (grey highlands)
      { lat: -43.31, lng: -11.36, r: 7, value: 0.42, label: 'Tycho (0 km)' },
      { lat: 9.62, lng: -20.08, r: 8, value: 0.44, label: 'Copernicus (0 km)' },
      { lat: 0, lng: 0, r: 20, value: 0.48, label: 'Central Highlands' },
      { lat: -30, lng: 120, r: 25, value: 0.52, label: 'Far Side Highlands' },
      // High terrain (mountains)
      { lat: 18.9, lng: 3.7, r: 10, value: 0.72, label: 'Montes Apenninus (+5 km)' },
      { lat: 26.1, lng: 3.6, r: 6, value: 0.75, label: 'Hadley Delta (+4 km)' },
      { lat: -60, lng: -30, r: 12, value: 0.78, label: 'Southern Highlands (+5 km)' },
      { lat: -89.9, lng: 0, r: 5, value: 0.68, label: 'South Pole Ridge (+3 km)' },
      { lat: 65, lng: -10, r: 8, value: 0.7, label: 'North Polar Rim (+3 km)' },
    ],
  },
  gravity: {
    label: 'Gravity (Mascons)',
    description: 'Gravitational anomalies (mass concentrations) used in space navigation',
    unit: 'mGal',
    gradient: ['#1a0a3e', '#3b1f8c', '#6633cc', '#9944cc', '#cc4488', '#ee4444', '#ff8800', '#ffcc00'],
    gradientLabels: ['−200 mGal', '0', '+200 mGal', '+400 mGal', '+600 mGal'],
    color: '#9944cc',
    regions: [
      // Strong positive mascons (high gravity — dense sub-surface material)
      { lat: 32.8, lng: -15.6, r: 14, value: 0.92, label: 'Imbrium Mascon (+350 mGal)' },
      { lat: 8.5, lng: 31.4, r: 11, value: 0.88, label: 'Tranquillitatis Mascon (+280 mGal)' },
      { lat: 18.4, lng: -57.4, r: 16, value: 0.85, label: 'Procellarum Mascon (+200 mGal)' },
      { lat: -20, lng: 60, r: 12, value: 0.82, label: 'Fecunditatis Mascon (+180 mGal)' },
      { lat: 44, lng: -20, r: 10, value: 0.78, label: 'Serenitatis Mascon (+310 mGal)' },
      { lat: 18, lng: 60, r: 10, value: 0.75, label: 'Crisium Mascon (+360 mGal)' },
      // Negative anomalies (low gravity — thinned crust)
      { lat: -53, lng: -169, r: 20, value: 0.2, label: 'SPA Basin (−180 mGal)' },
      { lat: 0, lng: 0, r: 18, value: 0.35, label: 'Highland Low (−60 mGal)' },
      { lat: -30, lng: 120, r: 22, value: 0.28, label: 'Far Side Low (−120 mGal)' },
    ],
  },
  minerals: {
    label: 'Minerals',
    description: 'Iron, titanium, helium-3 concentrations — scientific & commercial interest',
    unit: 'wt%',
    gradient: ['#0a1f0a', '#134d13', '#1a8c1a', '#66bb33', '#aadd22', '#ddcc00', '#ee8800', '#cc3300'],
    gradientLabels: ['Low', 'Medium', 'High', 'Very High'],
    color: '#66bb33',
    regions: [
      // High iron / titanium (dark maria — basaltic)
      { lat: 8.5, lng: 31.4, r: 12, value: 0.88, label: 'High TiO₂ — Tranquillitatis (13 wt%)' },
      { lat: 32.8, lng: -15.6, r: 14, value: 0.78, label: 'High FeO — Imbrium (10 wt%)' },
      { lat: 18.4, lng: -57.4, r: 18, value: 0.72, label: 'FeO — Procellarum (9 wt%)' },
      { lat: 23.7, lng: -47.4, r: 6, value: 0.95, label: 'Aristarchus — Pyroclastic He-3' },
      // Moderate mineral content
      { lat: -20, lng: 60, r: 12, value: 0.58, label: 'Fecunditatis — Medium FeO' },
      { lat: 44, lng: -20, r: 10, value: 0.62, label: 'Serenitatis — Medium TiO₂' },
      { lat: 18, lng: 60, r: 9, value: 0.65, label: 'Crisium — Medium FeO' },
      // Low mineral content (highlands — anorthosite)
      { lat: 0, lng: 0, r: 18, value: 0.22, label: 'Central Highlands — Low Fe' },
      { lat: -30, lng: 120, r: 24, value: 0.18, label: 'Far Side Highlands — Low Fe' },
      { lat: -53, lng: -169, r: 20, value: 0.45, label: 'SPA — Mixed Minerals' },
      // He-3 rich zones (solar wind implantation in mare soils)
      { lat: 8.5, lng: 31.4, r: 8, value: 0.9, label: 'He-3 — Tranquillitatis' },
      { lat: -89.9, lng: 0, r: 6, value: 0.3, label: 'South Pole — Ice + Volatiles' },
    ],
  },
  temperature: {
    label: 'Temperature',
    description: 'Surface temperature extremes: +127°C day / −173°C night',
    unit: '°C',
    gradient: ['#0a0a3e', '#1a1aaa', '#3388ff', '#44ddee', '#88ffcc', '#ffee44', '#ff8800', '#ff2200', '#880000'],
    gradientLabels: ['−173°C', '−100°C', '0°C', '+60°C', '+127°C'],
    color: '#ff8800',
    regions: [
      // Sub-solar point (hottest — equatorial day side)
      { lat: 0, lng: 0, r: 20, value: 0.95, label: 'Sub-solar Equator (+127°C)' },
      { lat: 0, lng: 30, r: 15, value: 0.9, label: 'Equatorial Day (+120°C)' },
      { lat: 0, lng: -30, r: 15, value: 0.9, label: 'Equatorial Day (+120°C)' },
      { lat: 15, lng: 0, r: 14, value: 0.88, label: 'Low Lat Day (+115°C)' },
      { lat: -15, lng: 0, r: 14, value: 0.88, label: 'Low Lat Day (+115°C)' },
      // Mid latitude — transitional
      { lat: 30, lng: 0, r: 12, value: 0.65, label: 'Mid Lat (+60°C)' },
      { lat: -30, lng: 0, r: 12, value: 0.65, label: 'Mid Lat (+60°C)' },
      { lat: 45, lng: 0, r: 10, value: 0.45, label: 'High Lat (+10°C avg)' },
      { lat: -45, lng: 0, r: 10, value: 0.45, label: 'High Lat (+10°C avg)' },
      // Polar night — permanently shadowed regions (PSRs)
      { lat: 65, lng: 0, r: 12, value: 0.18, label: 'North Polar Night (−140°C)' },
      { lat: -65, lng: 0, r: 12, value: 0.18, label: 'South Polar Night (−140°C)' },
      { lat: -89.9, lng: 0, r: 5, value: 0.05, label: 'Shackleton PSR (−173°C)' },
      { lat: 88, lng: 0, r: 5, value: 0.07, label: 'North Polar PSR (−170°C)' },
      // Night side (anti-solar)
      { lat: 0, lng: 180, r: 20, value: 0.08, label: 'Anti-solar Night (−150°C)' },
    ],
  },
};