import React, { useMemo, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAYER_COLORS } from './moonData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

function createIcon(type, isSelected) {
  const color = LAYER_COLORS[type];
  const size = isSelected ? 18 : 12;
  const shadow = isSelected ? `0 0 12px ${color}90, 0 0 24px ${color}50` : `0 0 6px ${color}60`;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid ${color}cc;border-radius:50%;box-shadow:${shadow};transition:all 0.3s;"></div>`,
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

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4 text-foreground" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4 text-foreground" />
      </button>
      <div className="w-px h-3 bg-border mx-auto" />
      <button
        onClick={() => map.setView([0, 0], 2, { animate: true })}
        className="w-9 h-9 flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border rounded-xl hover:bg-secondary transition-colors shadow-lg"
        title="Reset view"
      >
        <RotateCcw className="w-4 h-4 text-foreground" />
      </button>
    </div>
  );
}

function MarkerLayer({ markers, selectedMarker, onSelectMarker }) {
  const handleClick = useCallback((marker) => {
    onSelectMarker(marker);
  }, [onSelectMarker]);

  return useMemo(() => (
    <>
      {markers.map(marker => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={createIcon(marker.type, selectedMarker?.id === marker.id)}
          eventHandlers={{ click: () => handleClick(marker) }}
        />
      ))}
    </>
  ), [markers, selectedMarker, handleClick]);
}

export default function Moon2DMap({ markers, selectedMarker, onSelectMarker }) {
  const moonTileUrl = 'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/{z}/{x}/{y}.png';

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border relative">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={1}
        maxZoom={7}
        className="w-full h-full"
        style={{ background: '#010409' }}
        worldCopyJump={false}
        zoomControl={false}
      >
        <TileLayer url={moonTileUrl} attribution="" noWrap={true} />
        <MapController selectedMarker={selectedMarker} />
        <ZoomControls />
        <MarkerLayer markers={markers} selectedMarker={selectedMarker} onSelectMarker={onSelectMarker} />
      </MapContainer>
    </div>
  );
}