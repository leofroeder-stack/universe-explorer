import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAYER_COLORS } from './moonData';

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

// Zoom controls that match the 3D globe style
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

export default function Moon2DMap({ markers, selectedMarker, onSelectMarker }) {
  const moonTileUrl = 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png';

  const markerElements = useMemo(() => {
    return markers.map(marker => (
      <Marker
        key={marker.id}
        position={[marker.lat, marker.lng]}
        icon={createIcon(marker.type, selectedMarker?.id === marker.id)}
        eventHandlers={{ click: () => onSelectMarker(marker) }}
      />
    ));
  }, [markers, selectedMarker, onSelectMarker]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={7}
        className="w-full h-full"
        style={{ background: 'hsl(222 47% 6%)' }}
        worldCopyJump={false}
        zoomControl={false}
      >
        <TileLayer url={moonTileUrl} attribution="" noWrap={true} />
        <MapController selectedMarker={selectedMarker} />
        <ZoomControls />
        {markerElements}
      </MapContainer>
    </div>
  );
}