import React, { useMemo, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAYER_COLORS } from './moonData';

const MIN_ZOOM = 1;
const MAX_ZOOM = 7;
const SWITCH_TO_3D_ZOOM = 1; // switch back to 3D globe at this zoom level

function createIcon(type, isSelected) {
  const color = LAYER_COLORS[type];
  const size = isSelected ? 18 : 12;
  const shadow = isSelected ? `0 0 12px ${color}90, 0 0 24px ${color}50` : `0 0 6px ${color}60`;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid ${color}cc;
      border-radius:50%;
      box-shadow:${shadow};
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function MapController({ selectedMarker }) {
  const map = useMap();
  useEffect(() => {
    if (selectedMarker) {
      map.flyTo([selectedMarker.lat, selectedMarker.lng], 4, { duration: 1 });
    }
  }, [selectedMarker, map]);
  return null;
}

// Detects when user zooms out to minimum — triggers switch back to 3D
function ZoomOutWatcher({ onSwitchTo3D }) {
  const triggered = React.useRef(false);
  useMapEvents({
    zoomend: (e) => {
      const zoom = e.target.getZoom();
      if (zoom <= SWITCH_TO_3D_ZOOM && !triggered.current) {
        triggered.current = true;
        onSwitchTo3D();
      }
      if (zoom > SWITCH_TO_3D_ZOOM + 0.5) triggered.current = false;
    },
  });
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg text-foreground font-bold text-lg leading-none"
        title="Zoom In"
      >+</button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg text-foreground font-bold text-xl leading-none"
        title="Zoom Out"
      >−</button>
      <button
        onClick={() => map.flyTo([0, 0], 2, { duration: 0.8 })}
        className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-lg"
        title="Reset View"
      >
        <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  );
}

const TILE_URLS = {
  moon: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png',
  mars: 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png',
};

// Handles map clicks for measurement mode
function MeasurementClickHandler({ measureActive, markers, onMeasurePoint }) {
  useMapEvents({
    click: (e) => {
      if (!measureActive) return;
      // Snap to nearest marker within ~5deg, else use raw lat/lng
      const { lat, lng } = e.latlng;
      let snapped = { name: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`, lat, lng };
      let minDist = Infinity;
      markers.forEach(m => {
        const d = Math.hypot(m.lat - lat, m.lng - lng);
        if (d < minDist && d < 5) { minDist = d; snapped = m; }
      });
      onMeasurePoint(snapped);
    },
  });
  return null;
}

export default function Moon2DMap({ markers, selectedMarker, onSelectMarker, onSwitchTo3D, planet = 'moon', measureActive, measurePointA, measurePointB, onMeasurePoint }) {
  const moonTileUrl = TILE_URLS[planet] || TILE_URLS.moon;

  const markerElements = useMemo(() => {
    return markers.map(marker => (
      <Marker
        key={marker.id}
        position={[marker.lat, marker.lng]}
        icon={createIcon(marker.type, selectedMarker?.id === marker.id)}
        eventHandlers={{ click: () => { if (measureActive) onMeasurePoint?.(marker); else onSelectMarker(marker); } }}
      />
    ));
  }, [markers, selectedMarker, onSelectMarker, measureActive, onMeasurePoint]);

  // Geodesic line between the two points
  const measureLine = useMemo(() => {
    if (!measurePointA || !measurePointB) return null;
    return (
      <>
        <Polyline
          positions={[[measurePointA.lat, measurePointA.lng], [measurePointB.lat, measurePointB.lng]]}
          pathOptions={{ color: '#fbbf24', weight: 2, dashArray: '6 4', opacity: 0.85 }}
        />
        <CircleMarker center={[measurePointA.lat, measurePointA.lng]} radius={7} pathOptions={{ color: '#60a5fa', fillColor: '#60a5fa', fillOpacity: 1 }} />
        <CircleMarker center={[measurePointB.lat, measurePointB.lng]} radius={7} pathOptions={{ color: '#34d399', fillColor: '#34d399', fillOpacity: 1 }} />
      </>
    );
  }, [measurePointA, measurePointB]);

  return (
    <div className={`w-full h-full relative ${measureActive ? 'cursor-crosshair' : ''}`}>
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        className="w-full h-full"
        style={{ background: 'hsl(222 47% 6%)' }}
        worldCopyJump={false}
        zoomControl={false}
      >
        <TileLayer url={moonTileUrl} attribution="" noWrap={true} />
        <MapController selectedMarker={selectedMarker} />
        <ZoomControls />
        {onSwitchTo3D && <ZoomOutWatcher onSwitchTo3D={onSwitchTo3D} />}
        {markerElements}
        {measureLine}
        {measureActive && <MeasurementClickHandler measureActive={measureActive} markers={markers} onMeasurePoint={onMeasurePoint} />}
      </MapContainer>
    </div>
  );
}